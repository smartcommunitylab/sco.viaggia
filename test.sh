#!/usr/bin/env bash

if [ $CI_COMMIT_REF_NAME = "dev" ]; then
  link_ref="dev.smartcommunitylab.it"
elif [ $CI_COMMIT_REF_NAME = "prod" ]; then
  link_ref="tn.smartcommunitylab.it"
fi
link_num=$(grep -rl $link_ref viaggia-mobile/ | wc -l)
if [ $link_num -ge 4 ]; then
  echo "too many links to $CI_COMMIT_REF_NAME server"
  echo "check the following files:"
  grep -rl $link_ref viaggia-mobile/
  exit 1
fi
