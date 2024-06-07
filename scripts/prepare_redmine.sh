#!/bin/bash

cat <<EOF > config/database.yml
  test:
    adapter: postgis
    database: redmine
    host: postgres
    username: postgres
    password: postgres
    encoding: utf8
EOF
