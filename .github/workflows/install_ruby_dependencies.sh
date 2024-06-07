#!/bin/bash

bundle config set --local without 'development'
bundle install --jobs=4 --retry=3
