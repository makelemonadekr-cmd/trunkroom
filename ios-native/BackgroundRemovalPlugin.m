//
//  BackgroundRemovalPlugin.m
//  Capacitor 플러그인 등록 (Swift 클래스를 "BackgroundRemoval" 이름으로 JS에 노출)
//
//  JS: registerPlugin("BackgroundRemoval").removeBackground({ base64 })
//

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(BackgroundRemovalPlugin, "BackgroundRemoval",
           CAP_PLUGIN_METHOD(removeBackground, CAPPluginReturnPromise);
)
