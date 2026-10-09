import AppKit
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count >= 4 else {
    fputs("usage: render_line_stamp.swift SOURCE.png TEXT OUTPUT.png [fontSize] [artHeight] [cropHeight] [cropFromTop] [canvasWidth] [canvasHeight]\n", stderr)
    exit(2)
}

let sourceURL = URL(fileURLWithPath: CommandLine.arguments[1])
let text = CommandLine.arguments[2]
let outputURL = URL(fileURLWithPath: CommandLine.arguments[3])
let fontSize = CGFloat(CommandLine.arguments.count >= 5 ? (Double(CommandLine.arguments[4]) ?? 44) : 44)
let artHeight = CGFloat(CommandLine.arguments.count >= 6 ? (Double(CommandLine.arguments[5]) ?? 245) : 245)
let cropHeight = Int(CommandLine.arguments.count >= 7 ? (Double(CommandLine.arguments[6]) ?? 0) : 0)
let cropFromTop = Int(CommandLine.arguments.count >= 8 ? (Double(CommandLine.arguments[7]) ?? 0) : 0)
let canvasWidth = Int(CommandLine.arguments.count >= 9 ? (Double(CommandLine.arguments[8]) ?? 370) : 370)
let canvasHeight = Int(CommandLine.arguments.count >= 10 ? (Double(CommandLine.arguments[9]) ?? 320) : 320)

guard let source = CGImageSourceCreateWithURL(sourceURL as CFURL, nil),
      let sourceImage = CGImageSourceCreateImageAtIndex(source, 0, nil),
      let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
      let context = CGContext(
        data: nil,
        width: canvasWidth,
        height: canvasHeight,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
      ) else {
    fputs("could not load source image or create context\n", stderr)
    exit(1)
}

context.clear(CGRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight))

func alphaBounds(of image: CGImage) -> CGRect? {
    let width = image.width
    let height = image.height
    var pixels = [UInt8](repeating: 0, count: width * height * 4)
    let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
    pixels.withUnsafeMutableBytes { rawBuffer in
        guard let baseAddress = rawBuffer.baseAddress,
              let scanContext = CGContext(
                data: baseAddress,
                width: width,
                height: height,
                bitsPerComponent: 8,
                bytesPerRow: width * 4,
                space: colorSpace,
                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
              ) else { return }
        scanContext.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
    }

    var minX = width
    var minY = height
    var maxX = -1
    var maxY = -1
    for y in 0..<height {
        for x in 0..<width {
            if pixels[(y * width + x) * 4 + 3] > 8 {
                minX = min(minX, x)
                minY = min(minY, y)
                maxX = max(maxX, x)
                maxY = max(maxY, y)
            }
        }
    }
    guard maxX >= minX, maxY >= minY else { return nil }
    let padding = 4
    let x = max(0, minX - padding)
    let y = max(0, minY - padding)
    let right = min(width, maxX + padding + 1)
    let bottom = min(height, maxY + padding + 1)
    return CGRect(x: x, y: y, width: right - x, height: bottom - y)
}

let croppedImage: CGImage
if cropHeight > 0 && cropHeight < sourceImage.height {
    let cropY = max(0, cropFromTop)
    let cropRect = CGRect(x: 0, y: cropY, width: sourceImage.width, height: cropHeight)
    croppedImage = sourceImage.cropping(to: cropRect) ?? sourceImage
} else {
    croppedImage = sourceImage
}

let trimmedImage = alphaBounds(of: croppedImage).flatMap { croppedImage.cropping(to: $0) } ?? croppedImage

let sourceAspect = CGFloat(trimmedImage.width) / CGFloat(trimmedImage.height)
let artWidth = artHeight * sourceAspect
let artRect = CGRect(
    x: (CGFloat(canvasWidth) - artWidth) / 2,
    y: 10,
    width: artWidth,
    height: artHeight
)
context.interpolationQuality = .high
context.draw(trimmedImage, in: artRect)

let fontNames = [
    "Hiragino Kaku Gothic ProN W9",
    "Hiragino Kaku Gothic W9",
    "Hiragino Sans W9",
    "YuGothic-Bold"
]
let font = fontNames.lazy.compactMap { NSFont(name: $0, size: fontSize) }.first
    ?? NSFont.boldSystemFont(ofSize: fontSize)
let attributes: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: NSColor.black,
    .strokeColor: NSColor.white,
    .strokeWidth: -10.0
]
let attributedText = NSAttributedString(string: text, attributes: attributes)
let textSize = attributedText.size()
let textRect = CGRect(
    x: (CGFloat(canvasWidth) - textSize.width) / 2,
    y: 10,
    width: textSize.width,
    height: max(textSize.height + 12, 60)
)

let graphicsContext = NSGraphicsContext(cgContext: context, flipped: false)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = graphicsContext
attributedText.draw(in: textRect)
NSGraphicsContext.restoreGraphicsState()

guard let outputImage = context.makeImage(),
      let destination = CGImageDestinationCreateWithURL(
        outputURL as CFURL,
        UTType.png.identifier as CFString,
        1,
        nil
      ) else {
    fputs("could not create output PNG\n", stderr)
    exit(1)
}
CGImageDestinationAddImage(destination, outputImage, nil)
guard CGImageDestinationFinalize(destination) else {
    fputs("could not finalize output PNG\n", stderr)
    exit(1)
}
