# Website tra cứu barcode – Phú Nguyên

Bộ mã nguồn tĩnh chạy trên **GitHub Pages**, dữ liệu sản phẩm lưu tại **Supabase**.

## Chức năng đã có

- Trang danh mục sản phẩm tối ưu cho điện thoại.
- Tra cứu bằng mã barcode/SKU.
- Quét barcode Code 128 hoặc QR bằng camera điện thoại.
- Trang chi tiết hiển thị hình sản phẩm, công ty, quy cách, giá thị trường và giá bán.
- Trang quản trị có đăng nhập Supabase Auth, thêm/sửa/xóa sản phẩm và tải ảnh lên Supabase Storage.
- Trang in tem gồm barcode Code 128 và QR mở trực tiếp trang sản phẩm.
- 11 quy cách sản phẩm mẫu đã nhập theo bảng báo giá được cung cấp.

## 1. Tạo bảng dữ liệu Supabase

1. Mở dự án: `https://ilgammcebavzcvzpajoj.supabase.co`.
2. Vào **SQL Editor**.
3. Mở file `supabase_setup.sql`, sao chép toàn bộ và bấm **Run**.
4. Vào **Authentication → Users → Add user** để tạo tài khoản quản trị bằng email và mật khẩu.

## 2. Điền Supabase anon key

1. Vào **Project Settings → API**.
2. Sao chép khóa **anon public** hoặc **publishable key** dùng cho trình duyệt.
3. Mở `js/config.js` và thay:

```js
SUPABASE_ANON_KEY: 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE'
```

Không đưa `service_role key` vào website. Chỉ dùng anon/publishable key.

## 3. Đưa lên GitHub Pages

1. Tạo repository mới trên GitHub, ví dụ `phu-nguyen-barcode`.
2. Tải toàn bộ nội dung thư mục này lên nhánh `main`.
3. Vào **Settings → Pages**.
4. Chọn **Deploy from a branch** → `main` → `/ (root)` → **Save**.
5. Địa chỉ website sẽ có dạng:

```text
https://TEN_GITHUB.github.io/phu-nguyen-barcode/
```

`https://github.com/...` là trang chứa mã nguồn; đường dẫn khách hàng sử dụng để quét phải là đường dẫn `github.io` của GitHub Pages.

## 4. In tem và sử dụng

- Mở `labels.html` trên website GitHub Pages.
- Chọn **In tem**.
- Barcode Code 128 chứa mã nội bộ, ví dụ `PN-R5000-08`.
- QR chứa đường dẫn đầy đủ tới `product.html?code=...`, vì vậy camera điện thoại thường mở sản phẩm nhanh hơn.
- Khi giá thay đổi, chỉ cần sửa trong trang **Quản trị**; QR đã in vẫn giữ nguyên và luôn hiển thị giá mới.

## Lưu ý về hình ảnh

Các hình ban đầu được cắt từ ảnh bảng báo giá nên độ phân giải còn hạn chế. Trong trang quản trị, có thể tải ảnh sản phẩm rõ hơn lên bucket `product-images` của Supabase.
