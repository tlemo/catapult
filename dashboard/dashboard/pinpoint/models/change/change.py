# Copyright 2016 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

from __future__ import print_function
from __future__ import division
from __future__ import absolute_import

import collections

try:
  from itertools import zip_longest
except ImportError:
  from itertools import izip_longest as zip_longest

from dashboard.pinpoint.models.change import commit as commit_module
from dashboard.pinpoint.models.change import patch as patch_module


class Change(collections.namedtuple('Change', ('commits', 'patch'))):
  """A particular set of Commits with or without an additional patch applied.

  For example, a Change might sync to src@9064a40 and catapult@8f26966,
  then apply patch 2423293002.
  """

  def __new__(cls, commits, patch=None):
    """Creates a Change.

    Args:
      commits: An iterable of Commits representing this Change's dependencies.
      patch: An optional Patch to apply to the Change.
    """
    if not (commits or patch):
      raise TypeError('At least one commit or patch required.')
    return super(Change, cls).__new__(cls, tuple(commits), patch)

  def __str__(self):
    """Returns an informal short string representation of this Change."""
    string = ' '.join(str(commit) for commit in self.commits)
    if self.patch:
      string += ' + ' + str(self.patch)
    return string

  @property
  def id_string(self):
    """Returns a string that is unique to this set of commits and patch.

    This method treats the commits as unordered. chromium@a v8@b is the same as
    v8@b chromium@a. This is useful for looking up a build with this Change.
    """
    string = ' '.join(commit.id_string for commit in sorted(self.commits))
    if self.patch:
      string += ' + ' + self.patch.id_string
    return string

  @property
  def base_commit(self):
    return self.commits[0]

  @property
  def last_commit(self):
    return self.commits[-1]

  @property
  def deps(self):
    return tuple(self.commits[1:])

  def Update(self, other):
    """Updates this Change with another Change and returns it as a new Change.

    Similar to OrderedDict.update(), for each Commit in the other Change:
    * If the Commit's repository already exists in this Change,
      override the git hash with the other Commit's git hash.
    * Otherwise, add the Commit to this Change.
    Also apply the other Change's patches to this Change.

    Since Changes are immutable, this method returns a new Change instead of
    modifying the existing Change.

    Args:
      other: The overriding Change.

    Returns:
      A new Change object.
    """
    commits = collections.OrderedDict(self.commits)
    commits.update(other.commits)
    commits = tuple(commit_module.Commit(repository, git_hash)
                    for repository, git_hash in commits.items())

    if self.patch and other.patch:
      raise NotImplementedError(
          "Pinpoint builders don't yet support multiple patches.")
    patch = self.patch or other.patch

    return Change(commits, patch)

  def AsDict(self):
    result = {
        'commits': [commit.AsDict() for commit in self.commits],
    }

    if self.patch:
      result['patch'] = self.patch.AsDict()

    return result

  @classmethod
  def FromData(cls, data):
    if isinstance(data, basestring):
      return cls.FromUrl(data)
    else:
      return cls.FromDict(data)

  @classmethod
  def FromUrl(cls, url):
    try:
      return cls((commit_module.Commit.FromUrl(url),))
    except (KeyError, ValueError):
      return cls((), patch=patch_module.GerritPatch.FromUrl(url))

  @classmethod
  def FromDict(cls, data):
    commits = tuple(commit_module.Commit.FromDict(commit)
                    for commit in data['commits'])
    if 'patch' in data:
      patch = patch_module.GerritPatch.FromDict(data['patch'])
    else:
      patch = None

    return cls(commits, patch=patch)

  @classmethod
  def Midpoint(cls, change_a, change_b):
    """Returns a Change halfway between the two given Changes.

    This function does two passes over the Changes' Commits:
    * The first pass attempts to match the lengths of the Commit lists by
      expanding DEPS to fill in any repositories that are missing from one,
      but included in the other.
    * The second pass takes the midpoint of every matched pair of Commits,
      expanding DEPS rolls as it comes across them.

    A NonLinearError is raised if there is no valid midpoint. The Changes are
    not linear if any of the following is true:
      * They have different patches.
      * Their repositories don't match even after expanding DEPS rolls.
      * The left Change comes after the right Change.
      * They are the same or adjacent.
    See change_test.py for examples of linear and nonlinear Changes.

    Args:
      change_a: The first Change in the range.
      change_b: The last Change in the range.

    Returns:
      A new Change representing the midpoint.
      The Change before the midpoint if the range has an even number of commits.

    Raises:
      NonLinearError: The Changes are not linear.
    """
    if change_a.patch != change_b.patch:
      raise commit_module.NonLinearError(
          'Change A has patch "%s" and Change B has patch "%s".' %
          (change_a.patch, change_b.patch))

    commits_a = list(change_a.commits)
    commits_b = list(change_b.commits)

    _ExpandDepsToMatchRepositories(commits_a, commits_b)
    commits_midpoint = _FindMidpoints(commits_a, commits_b)

    if commits_a == commits_midpoint:
      raise commit_module.NonLinearError('Changes are the same or adjacent.')

    return cls(commits_midpoint, change_a.patch)


def _ExpandDepsToMatchRepositories(commits_a, commits_b):
  """Expands DEPS in a Commit list to match the repositories in another.

  Given two lists of Commits, with one bigger than the other, this function
  looks through the DEPS files for smaller commit list to fill out any missing
  Commits that are already in the bigger commit list.

  Mutates the lists in-place, and doesn't return anything. The lists will not
  have the same size if one Commit list contains a repository that is not found
  in the DEPS of the other Commit list.

  Example:
    commits_a == [chromium@a, v8@c]
    commits_b == [chromium@b]
    This function looks through the DEPS file at chromium@b to find v8, then
    appends that v8 Commit to commits_b, making the lists match.

  Args:
    commits_a: A list of Commits.
    commits_b: A list of Commits.
  """
  # The lists may be given in any order. Let's make commits_b the bigger list.
  if len(commits_a) > len(commits_b):
    commits_a, commits_b = commits_b, commits_a

  # Loop through every DEPS file in commits_a.
  for commit_a in commits_a:
    if len(commits_a) == len(commits_b):
      break
    deps_a = commit_a.Deps()

    # Look through commits_b for any extra slots to fill with the DEPS.
    for commit_b in commits_b[len(commits_a):]:
      dep_a = _FindRepositoryUrlInDeps(deps_a, commit_b.repository_url)
      if dep_a:
        commits_a.append(commit_module.Commit.FromDep(dep_a))
      else:
        break


def _FindMidpoints(commits_a, commits_b):
  """Returns the midpoint of two Commit lists.

  Loops through each pair of Commits and takes the midpoint. If the repositories
  don't match, a NonLinearError is raised. If the Commits are adjacent and
  represent a DEPS roll, the differing DEPs are added to the end of the lists.

  Args:
    commits_a: A list of Commits.
    commits_b: A list of Commits.

  Returns:
    A list of Commits, each of which is the midpoint of the respective Commit in
    commits_a and commits_b.

  Raises:
    NonLinearError: The lists have a different number of commits even after
      expanding DEPS rolls, a Commit pair contains differing repositories, or a
      Commit pair is in the wrong order.
  """
  commits_midpoint = []

  for commit_a, commit_b in zip_longest(commits_a, commits_b):
    if not (commit_a and commit_b):
      # If the commit lists are not the same length, bail out. That could happen
      # if commits_b has a repository that was not found in the DEPS of
      # commits_a (or vice versa); or a DEPS roll added or removed a DEP.
      raise commit_module.NonLinearError(
          'Changes have a different number of commits.')

    commit_midpoint = commit_module.Commit.Midpoint(commit_a, commit_b)
    commits_midpoint.append(commit_midpoint)
    if commit_a == commit_midpoint and commit_midpoint != commit_b:
      # Commits are adjacent.
      # Add any DEPS changes to the commit lists.
      deps_a = commit_a.Deps()
      deps_b = commit_b.Deps()
      commits_a += sorted(
          commit_module.Commit.FromDep(dep) for dep in deps_a.difference(deps_b)
          if not _FindRepositoryUrlInCommits(commits_a, dep.repository_url))
      commits_b += sorted(
          commit_module.Commit.FromDep(dep) for dep in deps_b.difference(deps_a)
          if not _FindRepositoryUrlInCommits(commits_b, dep.repository_url))

  return commits_midpoint


def _FindRepositoryUrlInDeps(deps, repository_url):
  for dep in deps:
    if dep[0] == repository_url:
      return dep
  return None


def _FindRepositoryUrlInCommits(commits, repository_url):
  for commit in commits:
    if commit.repository_url == repository_url:
      return commit
  return None
