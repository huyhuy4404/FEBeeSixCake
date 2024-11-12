var app = angular.module('myApp', []);

// Directive for handling file uploads
app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            element.bind('change', function () {
                scope.$apply(function () {
                    modelSetter(scope, element[0].files[0]); // Lưu trữ file đã chọn
                });
            });
        }
    };
}]);

app.controller('ProController', ['$scope', '$http', function ($scope, $http) {
    $scope.Products = [];
    $scope.selectedProduct = {
        category: null, // Đảm bảo category cũng là null
        size: null // Đặt kích thước mặc định là null
    };
    $scope.categories = [];
    $scope.sizes = [];
    $scope.message = '';
    $scope.messageType = '';
    $scope.isEditMode = false;

    // Load products from API
    $scope.loadProducts = function () {
        $http.get('http://localhost:8080/beesixcake/api/productdetail')
            .then(function (response) {
                $scope.Products = response.data; // Gán dữ liệu sản phẩm
            }, function (error) {
                console.error('Error loading products:', error);
                $scope.message = "Lỗi khi tải sản phẩm.";
                $scope.messageType = 'error';
            });
    };

    // Load categories from API
    $scope.loadCategories = function () {
        $http.get('http://localhost:8080/beesixcake/api/category')
            .then(function (response) {
                $scope.categories = response.data; // Gán dữ liệu danh mục
            }, function (error) {
                console.error('Error loading categories:', error);
                $scope.message = "Lỗi khi tải danh mục.";
                $scope.messageType = 'error';
            });
    };

    // Load sizes from API
    $scope.loadSizes = function () {
        $http.get('http://localhost:8080/beesixcake/api/size')
            .then(function (response) {
                $scope.sizes = response.data; // Gán dữ liệu kích thước
            }, function (error) {
                console.error('Error loading sizes:', error);
                $scope.message = "Lỗi khi tải kích thước.";
                $scope.messageType = 'error';
            });
    };

    // Upload image and display preview
    $scope.uploadImage = function (file) {
        if (file) {
            $scope.selectedProduct.img = file.name; // Lưu tên tệp
            var reader = new FileReader();
            reader.onload = function (event) {
                $scope.$apply(function () {
                    $scope.selectedProduct.imgPreview = event.target.result; // Hiển thị ảnh xem trước
                });
            };
            reader.readAsDataURL(file);
        }
    };

    // Hàm thêm sản phẩm
    $scope.addProduct = function () {
        var fd = new FormData();

        // Kiểm tra và gán giá trị cho isactive
        $scope.selectedProduct.isactive = $scope.selectedProduct.isactive !== false;

        // Thêm thông tin sản phẩm
        fd.append('productname', $scope.selectedProduct.productname);
        fd.append('img', $scope.selectedProduct.img); // Chỉ lưu tên tệp
        fd.append('description', $scope.selectedProduct.description);
        fd.append('isactive', $scope.selectedProduct.isactive); // Chuyển đổi kiểu nếu cần
        fd.append('category.idcategory', $scope.selectedProduct.category.idcategory);

        // Kiểm tra kích thước và đơn giá
        if (!$scope.selectedProduct.size || !$scope.selectedProduct.size.unitprice) {
            console.error("Lỗi: Đơn giá và kích thước sản phẩm chưa được chọn.");
            $scope.message = "Vui lòng chọn kích thước và đơn giá cho sản phẩm.";
            $scope.messageType = 'error';
            return;
        }

        // Kiểm tra số lượng tồn kho cho từng kích thước
        var quantity = 0;
        if (Array.isArray($scope.selectedProduct.sizes)) {
            $scope.selectedProduct.sizes.forEach(function (size) {
                if (size.quantity) {
                    quantity += parseFloat(size.quantity); // Cộng tổng số lượng cho tất cả các kích thước
                }
            });
        } else {
            console.error("Lỗi: sizes không phải là mảng hoặc chưa được khởi tạo.");
            $scope.message = "Dữ liệu kích thước không hợp lệ.";
            $scope.messageType = 'error';
            return;
        }

        console.log("Số lượng tồn kho kiểm tra:", quantity); // Debug tại đây

        if (quantity <= 0 || isNaN(quantity)) {
            console.error("Lỗi: Số lượng tồn kho sản phẩm chưa được chọn hoặc không hợp lệ.");
            $scope.message = "Vui lòng chọn số lượng tồn kho hợp lệ cho sản phẩm.";
            $scope.messageType = 'error';
            return;
        }

        console.log("Số lượng tồn kho hợp lệ:", quantity);
        fd.append('quantityinstock', quantity);

        // Gửi form data đến API để thêm sản phẩm
        $http.post('http://localhost:8080/beesixcake/api/product', fd, {
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined } // Để trình duyệt tự động thiết lập Content-Type
        }).then(function (response) {
            console.log("Sản phẩm đã được thêm thành công:", response.data);

            // Thêm chi tiết sản phẩm cho từng kích thước đã chọn
            var productDetailPromises = [];

            // Nếu có nhiều kích thước được chọn
            if (Array.isArray($scope.selectedProduct.sizes) && $scope.selectedProduct.sizes.length > 0) {
                $scope.selectedProduct.sizes.forEach(function (size) {
                    var productDetail = {
                        unitprice: size.unitprice,  // Đảm bảo dùng giá của kích thước
                        quantityinstock: size.quantity,  // Sử dụng số lượng của kích thước
                        product: { idproduct: response.data.idproduct }, // ID sản phẩm vừa thêm
                        size: { idsize: size.idsize } // ID kích thước
                    };

                    // Thực hiện thêm chi tiết sản phẩm vào API
                    productDetailPromises.push(
                        $http.post('http://localhost:8080/beesixcake/api/productdetail', productDetail)
                    );
                });
            }
            // Nếu chỉ có một kích thước, thêm chi tiết sản phẩm
            else {
                var productDetail = {
                    unitprice: $scope.selectedProduct.size.unitprice,
                    quantityinstock: quantity, // Sử dụng số lượng tổng
                    product: { idproduct: response.data.idproduct }, // ID sản phẩm vừa thêm
                    size: { idsize: $scope.selectedProduct.size.idsize } // ID kích thước
                };

                productDetailPromises.push(
                    $http.post('http://localhost:8080/beesixcake/api/productdetail', productDetail)
                );
            }

            // Chờ tất cả các promise được xử lý (thêm chi tiết sản phẩm)
            return Promise.all(productDetailPromises);
        }).then(function (responses) {
            console.log("Chi tiết sản phẩm đã được thêm thành công:", responses);
            $scope.loadProducts(); // Tải lại danh sách sản phẩm
            $scope.selectedProduct = {}; // Đặt lại form
            $scope.message = "Thêm sản phẩm và chi tiết sản phẩm thành công!";
            $scope.messageType = 'success';

        }).catch(function (error) {
            console.error('Lỗi khi thêm sản phẩm hoặc chi tiết sản phẩm:', error);
            $scope.message = "Thêm sản phẩm hoặc chi tiết sản phẩm thất bại. Vui lòng thử lại.";
            $scope.messageType = 'error';
        });
    };

    // Hàm log thông tin kích thước khi người dùng chọn
    $scope.logSelectedSize = function(size) {
        if (size.isSelected) {
            console.log("Kích thước đã chọn:", size.idsize);
            if (size.unitprice !== undefined && size.unitprice !== null) {
                console.log("Đơn giá của kích thước này:", size.unitprice);
            } else {
                console.log("Chưa có giá cho kích thước này.");
            }
            $scope.selectedProduct.size = size;
        } else {
            console.log("Kích thước bỏ chọn:", size.idsize);
            $scope.selectedProduct.size = null; // Xóa size nếu bỏ chọn
        }
    };

    // Hàm log thay đổi giá khi người dùng nhập
    $scope.logPriceChange = function(size) {
        if (size.unitprice !== undefined && size.unitprice !== null) {
            console.log("Đơn giá của kích thước " + size.sizename + " là:", size.unitprice);
        }
    };
    

    $scope.logQuantityChange = function(size) {
        if (size.quantity !== undefined && size.quantity !== null) {
            console.log("Số lượng của kích thước " + size.sizename + " là: " + size.quantity);
        } else {
            console.log("Chưa có số lượng cho kích thước " + size.sizename);
        }
    };
    
    
    
    // Edit product
    $scope.editProduct = function (product) {
        // Sao chép dữ liệu của sản phẩm đã chọn
        $scope.selectedProduct = angular.copy(product);
    
        // Kiểm tra và lấy giá trị của idproduct
        if (product.product && product.product.idproduct) {
            $scope.selectedProduct.idproduct = product.product.idproduct; // Gán giá trị idproduct
        } else {
            console.error('Không tìm thấy idproduct trong đối tượng sản phẩm:', product);
            return; // Dừng lại nếu không có idproduct
        }
    
        // Kiểm tra và lấy giá trị productDetailId
        if (product.idproductdetail) {
            $scope.selectedProduct.productDetailId = product.idproductdetail; // Gán giá trị productDetailId
        } else {
            console.error('Không tìm thấy productDetailId:', product);
            return; // Dừng lại nếu không có productDetailId
        }
    
        // Thiết lập imgPreview nếu sản phẩm có ảnh
        if (product.product.img && product.product.img !== 'null') {
            $scope.selectedProduct.imgPreview = '../admin/images/' + product.product.img; // Đường dẫn đến ảnh
            $scope.selectedProduct.img = product.product.img; // Gán lại img cũ nếu không chọn ảnh mới
        } else {
            $scope.selectedProduct.imgPreview = null; // Nếu không có ảnh
            $scope.selectedProduct.img = ''; // Đặt giá trị img về chuỗi rỗng nếu không có ảnh
        }
    
        // Lưu thông tin danh mục và kích thước
        $scope.selectedProduct.category = product.product.category; // Lưu đối tượng danh mục
        $scope.selectedProduct.size = product.size; // Lưu đối tượng kích thước
    
        // Thiết lập giá trị cho các thuộc tính khác
        $scope.selectedProduct.productname = product.product.productname; // Tên sản phẩm
        $scope.selectedProduct.unitprice = product.unitprice; // Giá sản phẩm
        $scope.selectedProduct.quantityinstock = product.quantityinstock; // Số lượng tồn kho
        $scope.selectedProduct.description = product.product.description || ""; // Ghi chú
        $scope.selectedProduct.isactive = product.product.isactive; // Trạng thái ẩn
    
        // Kích hoạt chế độ chỉnh sửa
        $scope.isEditMode = true;
    };
    
    // Trong hàm updateProduct
    $scope.updateProduct = function () {
        var productData = {
            idproduct: $scope.selectedProduct.idproduct,
            productname: $scope.selectedProduct.productname,
            img: $scope.selectedProduct.img || '', // Giữ giá trị img cũ nếu không có ảnh mới
            description: $scope.selectedProduct.description,
            isactive: $scope.selectedProduct.isactive,
            category: { idcategory: $scope.selectedProduct.category.idcategory },
            unitprice: $scope.selectedProduct.unitprice, // Giá sản phẩm
            quantityinstock: $scope.selectedProduct.quantityinstock // Số lượng tồn kho
        };
    
        // Kiểm tra productDetailId
        if (!$scope.selectedProduct.productDetailId) {
            console.error('productDetailId không có giá trị, không thể cập nhật chi tiết sản phẩm.');
            return; // Dừng lại nếu không có productDetailId
        }
    
        // Gửi yêu cầu PUT với JSON để cập nhật sản phẩm
        $http.put('http://localhost:8080/beesixcake/api/product/' + $scope.selectedProduct.idproduct, productData, {
            headers: { 'Content-Type': 'application/json' }
        }).then(function (response) {
            console.log("Cập nhật sản phẩm thành công:", response.data);
            
            // Cập nhật thông tin chi tiết sản phẩm
            var productDetail = {
                unitprice: $scope.selectedProduct.unitprice,
                quantityinstock: $scope.selectedProduct.quantityinstock,
                product: { idproduct: $scope.selectedProduct.idproduct }, // ID sản phẩm
                size: { idsize: $scope.selectedProduct.size.idsize } // ID kích thước
            };
    
            // Gửi yêu cầu PUT để cập nhật ProductDetail
            return $http.put('http://localhost:8080/beesixcake/api/productdetail/' + $scope.selectedProduct.productDetailId, productDetail);
        }).then(function (response) {
            console.log("Chi tiết sản phẩm đã được cập nhật thành công:", response.data);
            $scope.loadProducts(); // Tải lại danh sách sản phẩm
            $scope.selectedProduct = {}; // Đặt lại form
            $scope.message = "Cập nhật sản phẩm và chi tiết sản phẩm thành công!";
            $scope.messageType = 'success';
        }).catch(function (error) {
            console.error('Lỗi khi cập nhật sản phẩm hoặc chi tiết sản phẩm:', error);
            $scope.message = "Cập nhật sản phẩm hoặc chi tiết sản phẩm thất bại. Vui lòng thử lại.";
            $scope.messageType = 'error';
        });
    };

    





    // Delete product
    $scope.confirmDelete = function (id) {
        // Xác nhận xóa sản phẩm
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            // Gửi yêu cầu xóa đến API
            $http.delete('http://localhost:8080/beesixcake/api/productdetail/' + id)
                .then(function (response) {
                    // Nếu thành công, tải lại danh sách sản phẩm
                    $scope.loadProducts();
                    $scope.message = "Xóa sản phẩm thành công!";
                    $scope.messageType = 'success';
                }, function (error) {
                    // Nếu thất bại, hiển thị thông báo lỗi
                    console.error('Error deleting product:', error);
                    $scope.message = "Xóa sản phẩm thất bại. Vui lòng thử lại.";
                    $scope.messageType = 'error';
                });
        }
    };

    // Initial load
    $scope.loadProducts();
    $scope.loadCategories();
    $scope.loadSizes();
    // Sau khi thêm hoặc cập nhật thành công
    $scope.selectedProduct = {}; // Đặt lại form
}]);
