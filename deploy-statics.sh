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
ios_id=""
for inst in "${inst_lower[@]}"; do
  if [ $CI_COMMIT_REF_NAME == "prod" ]; then
    sed -i -e "s@\(\"content_url\": \"https://hcp.smartcommunitylab.it/\).*\"@\1viaggia\/$inst\"@g" cordova-hcp.json
    BLOB="$BLOB_URL_PROD$TOKEN"
  elif [ $CI_COMMIT_REF_NAME == "dev" ]; then
    sed -i -e "s@\(\"content_url\": \"https://hcp.smartcommunitylab.it/\).*\"@\1viaggia-dev\/$inst\"@g" cordova-hcp.json
    BLOB="$BLOB_URL_DEV$TOKEN"
  fi
  sed -i -e "s@\(\"android_identifier\": \"eu.trentorise.smartcampus.viaggia\).*\"@\1$inst\"@g" cordova-hcp.json
  sed -i -e "s@\(\"name\": \"viaggia\).*\"@\1$inst\"@g" cordova-hcp.json
  case $inst in
    rovereto)
      ios_id="id1063167516"
      ;;
    trento)
      ios_id="id1068474391"
      ;;
    *)
      ios_id=""
      echo "invalid app"
      ;;
  esac
  sed -i -e "s@\(\"ios_identifier\": \"\).*\"@\1$ios_id\"@g" cordova-hcp.json
  cp -r config/instances/${inst_upper[$i]}/www/* www/
  /cordova-hpc/node_modules/.bin/cordova-hcp build
  cp -r www/ ../upload/$inst
  i+=1
done
azcopy copy '../upload/*' $BLOB --recursive --cache-control 'max-age=360' --overwrite 'true'
