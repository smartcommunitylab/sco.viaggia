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


target=android-26
android.library.reference.1=CordovaLib
cordova.gradle.include.1=cordova-background-geolocation/playgo-build.gradle
cordova.system.library.1=com.android.support:support-v4:26.+
cordova.system.library.2=com.android.support:appcompat-v7:26.+
cordova.system.library.3=com.facebook.android:facebook-android-sdk:4.14.+
cordova.system.library.4=com.google.android.gms:play-services-auth:+
cordova.system.library.5=com.google.android.gms:play-services-identity:+
cordova.system.library.6=com.google.android.gms:play-services-location:+
cordova.system.library.7=com.google.android.gms:play-services-location:+
cordova.system.library.8=com.google.android.gms:play-services-location:11.6.0
cordova.system.library.9=com.android.support:appcompat-v7:26.+
cordova.gradle.include.2=cordova-plugin-firebase/playgo-build.gradle
cordova.system.library.10=com.google.android.gms:play-services-tagmanager:+
cordova.system.library.11=com.google.firebase:firebase-core:+
cordova.system.library.12=com.google.firebase:firebase-messaging:+
cordova.system.library.13=com.google.firebase:firebase-config:+
cordova.system.library.14=com.google.firebase:firebase-perf:+
cordova.system.library.15=com.android.support:support-v4:26.+