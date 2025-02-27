# Copyright 2019 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""Sheriff Config Service

This service implements the requirements for supporting sheriff configuration
file validation.
"""
from __future__ import print_function
from __future__ import division
from __future__ import absolute_import
import service

APP = service.CreateApp()
