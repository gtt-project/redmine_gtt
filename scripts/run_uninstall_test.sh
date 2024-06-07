#!/bin/bash

bundle exec rake redmine:plugins:migrate NAME=${{ env.PLUGIN_NAME }} VERSION=0
