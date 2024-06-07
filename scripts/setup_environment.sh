#!/bin/bash

apt-get update --yes --quiet
apt-get install --yes --quiet postgresql-client gcc libpq-dev make patch libgeos-dev curl

# For system test
if [ "${{ matrix.system_test }}" = "true" ]; then
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
  apt-get -y update
  apt-get install -y google-chrome-stable
fi

curl -sL https://deb.nodesource.com/setup_20.x | bash -
curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
apt-get update --yes --quiet
apt-get install --yes --quiet --no-install-recommends nodejs yarn
