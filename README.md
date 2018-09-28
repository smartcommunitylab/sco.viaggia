# sco.viaggia
For firebase plugin:

Changing Notification Icon
The plugin will use notification_icon from drawable resources if it exists, otherwise the default app icon is used. To set a big icon and small icon for notifications, define them through drawable nodes.
Create the required styles.xml files and add the icons to the
<projectroot>/res/native/android/res/<drawable-DPI> folders.

The example below uses a png named ic_silhouette.png, the app Icon (@mipmap/icon) and sets a base theme.
From android version 21 (Lollipop) notifications were changed, needing a separate setting.
If you only target Lollipop and above, you don't need to setup both.
Thankfully using the version dependant asset selections, we can make one build/apk supporting all target platforms.
<projectroot>/res/native/android/res/values/styles.xml

<?xml version="1.0" encoding="utf-8" ?>
<resources>
    <!-- inherit from the holo theme -->
    <style name="AppTheme" parent="android:Theme.Light">
        <item name="android:windowDisablePreview">true</item>
    </style>
    <drawable name="notification_big">@mipmap/icon</drawable>
    <drawable name="notification_icon">@mipmap/icon</drawable>
</resources>
and
<projectroot>/res/native/android/res/values-v21/styles.xml

<?xml version="1.0" encoding="utf-8" ?>
<resources>
    <!-- inherit from the material theme -->
    <style name="AppTheme" parent="android:Theme.Material">
        <item name="android:windowDisablePreview">true</item>
    </style>
    <drawable name="notification_big">@mipmap/icon</drawable>
    <drawable name="notification_icon">@drawable/ic_silhouette</drawable>
</resources>
Notification Colors
On Android Lollipop and above you can also set the accent color for the notification by adding a color setting.

<projectroot>/res/native/android/res/values/colors.xml

<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">#FFFFFF00</color>
    <color name="primary_dark">#FF220022</color>
    <color name="accent">#FF00FFFF</color>
</resources>



This is the final package.json u must have
target=android-26
android.library.reference.1=CordovaLib
cordova.gradle.include.1=cordova-background-geolocation/playgo-build.gradle
cordova.system.library.1=com.android.support:support-v4:26.+
cordova.system.library.2=com.android.support:appcompat-v7:26.+
cordova.system.library.3=com.facebook.android:facebook-android-sdk:4.14.+
cordova.system.library.4=com.google.android.gms:play-services-auth:+
cordova.system.library.5=com.google.android.gms:play-services-identity:+
cordova.system.library.6=com.google.android.gms:play-services-location:+
cordova.system.library.9=com.android.support:appcompat-v7:26.+
cordova.gradle.include.2=cordova-plugin-firebase/playgo-build.gradle
cordova.system.library.10=com.google.android.gms:play-services-tagmanager:+
cordova.system.library.11=com.google.firebase:firebase-core:+
cordova.system.library.12=com.google.firebase:firebase-messaging:+
cordova.system.library.13=com.google.firebase:firebase-config:+
cordova.system.library.14=com.google.firebase:firebase-perf:+
cordova.gradle.include.3=cordova-hot-code-push-plugin/playgo-chcp.gradle


Version updated of plugins:
cordova-background-geolocation 2.9.1 "BackgroundGeolocation"
cordova-custom-config 5.0.2 "cordova-custom-config"
cordova-hot-code-push-plugin 1.5.3 "Hot Code Push Plugin"
cordova-plugin-app-event 1.2.1 "Application Events"
cordova-plugin-app-version 0.1.9 "AppVersion"
cordova-plugin-background-fetch 5.1.1 "CDVBackgroundFetch"
cordova-plugin-bluetooth-serial 0.4.7 "Bluetooth Serial"
cordova-plugin-compat 1.2.0 "Compat"
cordova-plugin-console 1.1.0 "Console"
cordova-plugin-device 2.0.2 "Device"
cordova-plugin-device-orientation 2.0.1 "Device Orientation"
cordova-plugin-dialogs 2.0.1 "Notification"
cordova-plugin-facebook4 1.7.4 "Facebook Connect"
cordova-plugin-file 6.0.1 "File"
cordova-plugin-firebase 2.0.2 "Google Firebase Plugin"
cordova-plugin-geolocation 4.0.1 "Geolocation"
cordova-plugin-googleplus 5.1.1 "Google SignIn"
cordova-plugin-inappbrowser 3.0.0 "InAppBrowser"
cordova-plugin-network-information 2.0.1 "Network Information"
cordova-plugin-request-location-accuracy 2.2.3 "Request Location Accuracy"
cordova-plugin-screen-orientation 3.0.1 "Screen Orientation"
cordova-plugin-splashscreen 5.0.2 "Splashscreen"
cordova-plugin-statusbar 2.4.2 "StatusBar"
cordova-plugin-whitelist 1.3.3 "Whitelist"
cordova-plugin-x-toast 2.7.0 "Toast"
cordova-sqlite-storage 2.4.0 "Cordova sqlite storage plugin"
cordova.plugins.diagnostic 4.0.10 "Diagnostic"
de.appplant.cordova.plugin.local-notification 0.8.5 "LocalNotification"
es6-promise-plugin 4.2.2 "Promise"
ionic-plugin-keyboard 2.2.1 "Keyboard"
