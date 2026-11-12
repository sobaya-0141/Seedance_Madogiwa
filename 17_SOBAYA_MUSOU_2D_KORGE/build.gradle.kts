import korlibs.korge.gradle.*

plugins {
	alias(libs.plugins.korge)
}

korge {
	id = "jp.madogiwa.sobayamusou2d"
	name = "そば屋無双2D"
	// 横スクロールのベルトアクションなので、スマホでは横向きに固定する
	orientation = Orientation.LANDSCAPE

	// PC（JVM）・Web（JS）・Android・iOS
	targetJvm()
	targetJs()
	targetAndroid()
	targetIos()
}

dependencies {
	add("commonMainApi", project(":deps"))
}

// iOS: KorGE 6.0.0 が生成する main.m と Info.plist は UIScene に対応しておらず、iOS 27 では起動直後に止められる。
// 生成のあとで、UIScene 対応・横向き固定にした ios_template/ の版に差し替える
tasks.matching { it.name == "prepareKotlinNativeIosProject" }.configureEach {
	doLast {
		copy {
			from("ios_template")
			into(layout.buildDirectory.dir("platforms/ios/app"))
		}
	}
}
