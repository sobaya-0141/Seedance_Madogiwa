import korlibs.korge.gradle.*

plugins {
	alias(libs.plugins.korge)
}

korge {
	id = "jp.madogiwa.sobayamusou2d"
	name = "そば屋無双2D"

	// 試作はPC（JVM）のみ。Web版にするときは targetJs() / targetWasm() を足す
	targetJvm()
}

dependencies {
	add("commonMainApi", project(":deps"))
}
