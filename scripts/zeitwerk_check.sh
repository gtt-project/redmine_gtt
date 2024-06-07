#!/bin/bash

if grep -q zeitwerk config/application.rb ; then
  bundle exec rake zeitwerk:check
fi
