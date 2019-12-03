#!/usr/bin/env bash

if [ $CI_COMMIT_REF_NAME = "dev" ]; then
  link_tfind="tn.smartcommunitylab.it"
  link_trepl="dev.smartcommunitylab.it"
elif [ $CI_COMMIT_REF_NAME = "prod" ]; then
  link_tfind="dev.smartcommunitylab.it"
  link_trepl="tn.smartcommunitylab.it"
fi
link_num=$(grep -rl $link_tfind viaggia-mobile/config/instances/ | wc -l)
if [ $link_num -gt 0 ]; then
  grep -rl $link_tfind viaggia-mobile/config/instances/ | xargs sed -i "s/$link_tfind/$link_trepl/"
fi
