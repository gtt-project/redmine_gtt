#!/bin/bash

bundle exec rake generate_secret_token
bundle exec rake db:create db:migrate redmine:plugins:migrate
