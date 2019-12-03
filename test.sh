#!/usr/bin/env bash

if [ $CI_COMMIT_REF_NAME = "dev" ]; then
  link_ref="tn.smartcommunitylab.it"
elif [ $CI_COMMIT_REF_NAME = "prod" ]; then
  link_ref="dev.smartcommunitylab.it"
fi
link_num=$(grep -rl $link_ref viaggia-mobile/config/instances/ | wc -l)
echo $link_num
if [ $link_num -gt 2 ]; then
  echo "too many links to $link_ref server"
  echo "check the following files:"
  grep -rl $link_ref viaggia-mobile/
  exit 1
fi
