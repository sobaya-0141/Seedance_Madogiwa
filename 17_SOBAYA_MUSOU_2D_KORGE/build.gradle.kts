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
