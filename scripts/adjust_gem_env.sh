#!/bin/bash

case "${{ matrix.redmine_version }}" in
  master)
    echo "GEM_ACTIVERECORD_POSTGIS_ADAPTER_VERSION=9.0.1" >> ${GITHUB_ENV}
    ;;
esac
