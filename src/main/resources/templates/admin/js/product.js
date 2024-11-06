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

    // Add new product
    $scope.uploadImage = function (file) {
        if (file) {
            // Chỉ lưu tên tệp
            $scope.selectedProduct.img = file.name; // Lưu tên tệp
            var reader = new FileReader();
            reader.onload = function (event) {
                $scope.$apply(function () {
                    $scope.selectedProduct.imgPreview = event.target.result; // Để xem trước ảnh
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
        fd.append('img', $scope.selectedProduct.img); // Chỉ lưu tên tệp, không phải toàn bộ đường dẫn
        fd.append('description', $scope.selectedProduct.description);
        fd.append('isactive', $scope.selectedProduct.isactive); // Chuyển đổi kiểu nếu cần
        fd.append('category.idcategory', $scope.selectedProduct.category.idcategory);
    
        // Gửi form data đến API để thêm sản phẩm
        $http.post('http://localhost:8080/beesixcake/api/product', fd, {
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined } // Để trình duyệt tự động thiết lập Content-Type
        }).then(function (response) {
            console.log("Sản phẩm đã được thêm thành công:", response.data);
    
            // Thêm thông tin chi tiết sản phẩm vào ProductDetail
            var productDetail = {
                unitprice: $scope.selectedProduct.unitprice,
                quantityinstock: $scope.selectedProduct.quantityinstock,
                product: { idproduct: response.data.idproduct }, // ID sản phẩm vừa thêm
                size: { idsize: $scope.selectedProduct.size.idsize } // ID kích thước
            };
    
            // Gửi yêu cầu thêm ProductDetail
            return $http.post('http://localhost:8080/beesixcake/api/productdetail', productDetail);
        }).then(function (response) {
            console.log("Chi tiết sản phẩm đã được thêm thành công:", response.data);
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
    
        // Chuyển hướng sang trang khác để chỉnh sửa sản phẩm
        $location.path('/edit-product/' + $scope.selectedProduct.idproduct);
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
// Hàm xóa sản phẩm
$scope.deleteProduct = function (idproduct) {
    if (!idproduct) {
        console.error("Không tìm thấy idproduct, không thể xóa.");
        return;
    }

    // Hiển thị cảnh báo để xác nhận người dùng trước khi xóa
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) {
        // Gửi yêu cầu xóa chi tiết sản phẩm trước
        $http.delete('http://localhost:8080/beesixcake/api/productdetail/' + $scope.selectedProduct.productDetailId)
            .then(function (response) {
                console.log("Chi tiết sản phẩm đã được xóa thành công:", response.data);

                // Sau khi xóa chi tiết sản phẩm, xóa sản phẩm
                return $http.delete('http://localhost:8080/beesixcake/api/product/' + idproduct);
            })
            .then(function (response) {
                console.log("Sản phẩm đã được xóa thành công:", response.data);
                $scope.loadProducts(); // Tải lại danh sách sản phẩm
                $scope.selectedProduct = {}; // Đặt lại form
                $scope.message = "Sản phẩm và chi tiết sản phẩm đã được xóa thành công!";
                $scope.messageType = 'success';
                $scope.isEditMode = false; // Thoát khỏi chế độ chỉnh sửa
            })
            .catch(function (error) {
                console.error('Lỗi khi xóa sản phẩm hoặc chi tiết sản phẩm:', error);
                $scope.message = "Xóa sản phẩm hoặc chi tiết sản phẩm thất bại. Vui lòng thử lại.";
                $scope.messageType = 'error';
            });
    }
};


$scope.selectedSizes = [];  // Lưu các size đã chọn

$scope.updateSelectedSizes = function() {
    // Reset lại các kích thước đã chọn
    $scope.selectedSizes = [];

    // Duyệt qua các size để kiểm tra size nào được chọn
    angular.forEach($scope.sizes, function(size) {
        if (size.selected) {
            // Nếu size được chọn thì thêm vào danh sách
            $scope.selectedSizes.push({
                size: size,
                quantity: '',
                price: '',
                discount: false,  // Thêm giảm giá nếu cần
                note: '',
                image: ''
            });
        }
    });
};



    // Initial load
    $scope.loadProducts();
    $scope.loadCategories();
    $scope.loadSizes();
    // Sau khi thêm hoặc cập nhật thành công
    $scope.selectedProduct = {}; // Đặt lại form
}]);
