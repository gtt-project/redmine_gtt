#!/bin/bash

bundle exec rake redmine:plugins:test:units NAME=${{ env.PLUGIN_NAME }} RUBYOPT="-W0"
bundle exec rake redmine:plugins:test:functionals NAME=${{ env.PLUGIN_NAME }} RUBYOPT="-W0"
bundle exec rake redmine:plugins:test:integration NAME=${{ env.PLUGIN_NAME }} RUBYOPT="-W0"
if [ "${{ matrix.system_test }}" = "true" ]; then
  bundle exec rake redmine:plugins:test:system NAME=${{ env.PLUGIN_NAME }} RUBYOPT="-W0"
fi
