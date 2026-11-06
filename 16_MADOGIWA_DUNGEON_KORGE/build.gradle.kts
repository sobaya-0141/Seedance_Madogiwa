import korlibs.korge.gradle.*

plugins {
	alias(libs.plugins.korge)
}

korge {
	id = "jp.madogiwa.dungeon"
	name = "窓際ダンジョン"

	// 試作はPC（JVM）のみ。Web版にするときは targetJs() / targetWasm() を足す
	targetJvm()
}

dependencies {
	add("commonMainApi", project(":deps"))
}
