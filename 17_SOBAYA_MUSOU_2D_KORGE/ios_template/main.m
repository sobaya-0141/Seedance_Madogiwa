// KorGE 6.0.0 が生成する main.m を、UIScene のライフサイクルに対応させたもの。
// iOS 27 からは UIScene を使わないアプリは起動直後に止められるため、build.gradle.kts でこのファイルに差し替える。
#import <UIKit/UIKit.h>
#import <GameMain/GameMain.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate>
@end

@interface SceneDelegate : UIResponder <UIWindowSceneDelegate>
@property (strong, nonatomic) UIWindow *window;
@end

int main(int argc, char * argv[]) {
    @autoreleasepool { return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class])); }
}

@implementation AppDelegate
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    // ゲームの起動はシーンが用意できてから（SceneDelegate）行う
    return YES;
}
- (UISceneConfiguration *)application:(UIApplication *)application configurationForConnectingSceneSession:(UISceneSession *)session options:(UISceneConnectionOptions *)options {
    UISceneConfiguration *config = [[UISceneConfiguration alloc] initWithName:@"Default Configuration" sessionRole:session.role];
    config.delegateClass = [SceneDelegate class];
    return config;
}
- (void)applicationWillTerminate:(UIApplication *)application {
    [[GameMainNewAppDelegate getNewAppDelegate] applicationWillTerminateApp: application];
}
@end

@implementation SceneDelegate
- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)connectionOptions {
    UIWindowScene *windowScene = (UIWindowScene *)scene;
    GameMainNewAppDelegate *game = [GameMainNewAppDelegate getNewAppDelegate];
    // KorGE が画面サイズの UIWindow とゲームの画面を作る。それをこのシーンに載せる
    [game applicationDidFinishLaunchingApp: [UIApplication sharedApplication]];
    UIWindow *window = game.window;
    window.windowScene = windowScene;
    window.frame = windowScene.coordinateSpace.bounds;
    self.window = window;
    [window makeKeyAndVisible];
}
- (void)sceneWillResignActive:(UIScene *)scene {
    [[GameMainNewAppDelegate getNewAppDelegate] applicationWillResignActiveApp: [UIApplication sharedApplication]];
}
- (void)sceneDidEnterBackground:(UIScene *)scene {
    [[GameMainNewAppDelegate getNewAppDelegate] applicationDidEnterBackgroundApp: [UIApplication sharedApplication]];
}
- (void)sceneWillEnterForeground:(UIScene *)scene {
    [[GameMainNewAppDelegate getNewAppDelegate] applicationWillEnterForegroundApp: [UIApplication sharedApplication]];
}
- (void)sceneDidBecomeActive:(UIScene *)scene {
    [[GameMainNewAppDelegate getNewAppDelegate] applicationDidBecomeActiveApp: [UIApplication sharedApplication]];
}
@end
