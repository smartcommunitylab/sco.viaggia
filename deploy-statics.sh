#!/usr/bin/env bash
declare -i i=0
declare -a inst_lower
declare -a inst_upper
mkdir upload
root_dir=$(pwd)
cd viaggia-mobile/config/instances/ || exit
for f in *; do
  if [ -d "$f" ]; then
    inst_lower[${i}]=$(echo "$f" | tr '[:upper:]' '[:lower:]')
    inst_upper[${i}]=$f
    i+=1
  fi
done
echo "${root_dir}"
cd ${root_dir}/viaggia-mobile || exit
i=0
for inst in "${inst_lower[@]}"; do
  sed -i -e "s@\(\"content_url\": \"https://hotcode.z6.web.core.windows.net/\).*\"@\1$inst\"@g" cordova-hcp.json
  sed -i -e "s@\(\"android_identifier\": \"eu.trentorise.smartcampus.viaggia\).*\"@\1$inst\"@g" cordova-hcp.json
  cp -r config/instances/${inst_upper[$i]}/www/* www/
  /cordova-hpc/node_modules/.bin/cordova-hcp build
  cp -r www/ ../upload/$inst
  i+=1
done
BLOB="$BLOB_URL\$web$TOKEN"
azcopy sync '../upload/' $BLOB --recursive --delete-destination=true
