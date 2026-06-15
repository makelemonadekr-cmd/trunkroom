//
//  BackgroundRemovalPlugin.swift
//  Trunk Room — 아이폰 네이티브 누끼 (배경 제거)
//
//  iOS 17+ Vision 프레임워크(VNGenerateForegroundInstanceMaskRequest)로
//  온디바이스 배경 제거. 무료·빠름·업로드 없음(프라이버시)·API 비용 0.
//
//  ⚙️ 설치: 이 파일과 BackgroundRemovalPlugin.m 을 Xcode에서 App 타겟에 추가
//     (ios/App/App/ 폴더). 자세한 건 ios-native/README.md 참고.
//

import Foundation
import Capacitor
import Vision
import UIKit
import CoreImage

@objc(BackgroundRemovalPlugin)
public class BackgroundRemovalPlugin: CAPPlugin {

    /// JS: BackgroundRemoval.removeBackground({ base64 }) → { base64, bgRemoved }
    @objc func removeBackground(_ call: CAPPluginCall) {
        guard var b64 = call.getString("base64") else {
            call.reject("base64 가 필요합니다")
            return
        }

        // data URL 접두사 제거 (data:image/...;base64,XXXX)
        if b64.hasPrefix("data:"), let comma = b64.range(of: ",")?.upperBound {
            b64 = String(b64[comma...])
        }

        guard let data = Data(base64Encoded: b64, options: .ignoreUnknownCharacters),
              let image = UIImage(data: data) else {
            call.reject("이미지를 읽을 수 없습니다")
            return
        }

        guard #available(iOS 17.0, *) else {
            call.reject("iOS 17 이상에서만 지원됩니다")
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            let normalized = self.normalizedUp(image)
            guard let cgImage = normalized.cgImage else {
                call.reject("이미지 변환 실패")
                return
            }

            let request = VNGenerateForegroundInstanceMaskRequest()
            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

            do {
                try handler.perform([request])

                guard let observation = request.results?.first else {
                    call.reject("피사체를 찾지 못했습니다")
                    return
                }

                // 피사체만 남기고 배경을 투명하게 — RGBA 마스크 이미지(CVPixelBuffer)
                let maskedBuffer = try observation.generateMaskedImage(
                    ofInstances: observation.allInstances,
                    from: handler,
                    croppedToInstancesExtent: false
                )

                let ciImage = CIImage(cvPixelBuffer: maskedBuffer)
                let context = CIContext()
                guard let outCg = context.createCGImage(ciImage, from: ciImage.extent) else {
                    call.reject("렌더링 실패")
                    return
                }

                let outImage = UIImage(cgImage: outCg)
                guard let png = outImage.pngData() else {
                    call.reject("PNG 변환 실패")
                    return
                }

                call.resolve([
                    "base64": png.base64EncodedString(),
                    "bgRemoved": true
                ])
            } catch {
                call.reject("Vision 처리 실패: \(error.localizedDescription)")
            }
        }
    }

    /// EXIF 회전 정보를 픽셀에 반영(.up 정규화) — 카메라 사진 회전 깨짐 방지
    private func normalizedUp(_ image: UIImage) -> UIImage {
        if image.imageOrientation == .up { return image }
        UIGraphicsBeginImageContextWithOptions(image.size, false, image.scale)
        image.draw(in: CGRect(origin: .zero, size: image.size))
        let result = UIGraphicsGetImageFromCurrentImageContext() ?? image
        UIGraphicsEndImageContext()
        return result
    }
}
