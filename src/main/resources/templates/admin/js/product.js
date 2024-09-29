var app = angular.module('myApp', []);

// Directive for handling file uploads
app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            element.bind('change', function() {
                scope.$apply(function() {
                    modelSetter(scope, element[0].files[0]); // Lưu trữ file đã chọn
                });
            });
        }
    };
}]);

app.controller('ProController', ['$scope', '$http', function($scope, $http) {
    $scope.Products = [];
    $scope.selectedProduct = {};
    $scope.categories = [];
    $scope.sizes = [];
    $scope.message = '';
    $scope.messageType = '';

    // Load products from API
    $scope.loadProducts = function() {
        $http.get('http://localhost:8080/beesixcake/api/productdetail')
            .then(function(response) {
                $scope.Products = response.data; // Gán dữ liệu sản phẩm
            }, function(error) {
                console.error('Error loading products:', error);
                $scope.message = "Lỗi khi tải sản phẩm.";
                $scope.messageType = 'error';
            });
    };

    // Load categories from API
    $scope.loadCategories = function() {
        $http.get('http://localhost:8080/beesixcake/api/category')
            .then(function(response) {
                $scope.categories = response.data; // Gán dữ liệu danh mục
            }, function(error) {
                console.error('Error loading categories:', error);
                $scope.message = "Lỗi khi tải danh mục.";
                $scope.messageType = 'error';
            });
    };

    // Load sizes from API
    $scope.loadSizes = function() {
        $http.get('http://localhost:8080/beesixcake/api/size')
            .then(function(response) {
                $scope.sizes = response.data; // Gán dữ liệu kích thước
            }, function(error) {
                console.error('Error loading sizes:', error);
                $scope.message = "Lỗi khi tải kích thước.";
                $scope.messageType = 'error';
            });
    };

    // Add new product
    $scope.addProduct = function() {
        var fd = new FormData();

        // Thêm thông tin sản phẩm
        fd.append('product', JSON.stringify({
            productname: $scope.selectedProduct.productname,
            img: $scope.selectedProduct.img ? $scope.selectedProduct.img.name : null,
            description: $scope.selectedProduct.description,
            isactive: $scope.selectedProduct.isactive,
            category: {
                idcategory: $scope.selectedProduct.category.idcategory
            }
        }));

        // Thêm file hình ảnh vào FormData (nếu có)
        if ($scope.selectedProduct.img) {
            fd.append('file', $scope.selectedProduct.img);
        }

        // Gửi form data đến API để thêm sản phẩm
        $http.post('http://localhost:8080/beesixcake/api/product', fd, {
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined }
        }).then(function(response) {
            var productId = response.data.idproduct; // Lấy ID của sản phẩm vừa thêm
            
            // Thêm thông tin chi tiết sản phẩm
            var productDetailData = {
                unitprice: $scope.selectedProduct.unitprice,
                quantityinstock: $scope.selectedProduct.quantityinstock,
                product: {
                    idproduct: productId // Gán ID sản phẩm
                },
                size: {
                    idsize: $scope.selectedProduct.size.idsize // Gán ID kích thước
                }
            };

            // Gửi thông tin chi tiết sản phẩm đến API
            return $http.post('http://localhost:8080/beesixcake/api/productdetail', productDetailData);
        }).then(function(detailResponse) {
            console.log("Chi tiết sản phẩm đã được thêm thành công", detailResponse.data);
            $scope.loadProducts(); // Tải lại danh sách sản phẩm
            $scope.selectedProduct = {}; // Đặt lại form
            $scope.message = "Thêm sản phẩm và chi tiết sản phẩm thành công!";
            $scope.messageType = 'success';  
        }, function(error) {
            console.error('Lỗi khi thêm sản phẩm:', error);
            $scope.message = "Thêm sản phẩm thất bại. Vui lòng thử lại.";
            $scope.messageType = 'error';  
        });
    };

    // Preview image upload
    $scope.uploadImage = function(file) {
        if (file) {
            $scope.selectedProduct.img = file; // Giữ file để thêm vào FormData
            var reader = new FileReader();
            reader.onload = function(event) {
                $scope.$apply(function() {
                    $scope.selectedProduct.imgPreview = event.target.result; // Để xem trước ảnh
                });
            };
            reader.readAsDataURL(file);
        }
    };
    // edit
    $scope.editProduct = function(product) {
        // Sao chép dữ liệu của sản phẩm đã chọn
        $scope.selectedProduct = angular.copy(product);
    
        // Thiết lập imgPreview nếu sản phẩm có ảnh
        if (product.product.img && product.product.img !== 'null') {
            $scope.selectedProduct.imgPreview = '../admin/images/' + product.product.img; // Đường dẫn đến ảnh
        } else {
            $scope.selectedProduct.imgPreview = null; // Nếu không có ảnh
        }
    
        // Lưu thông tin danh mục và kích thước
        $scope.selectedProduct.category = product.product.category; // Lưu đối tượng danh mục
        $scope.selectedProduct.size = product.size; // Lưu đối tượng kích thước
    
        // Thiết lập giá trị cho các thuộc tính khác
        $scope.selectedProduct.productname = product.product.productname; // Tên sản phẩm
        $scope.selectedProduct.unitprice = product.unitprice; // Giá sản phẩm
        $scope.selectedProduct.quantityinstock = product.quantityinstock; // Số lượng tồn kho
        $scope.selectedProduct.description = product.product.description; // Ghi chú
        $scope.selectedProduct.isactive = product.product.isactive; // Trạng thái ẩn
    
        // Kích hoạt chế độ chỉnh sửa
        $scope.isEditMode = true;
    };
    
    





   // Cập nhật sản phẩm
$scope.updateProduct = function() {
    var fd = new FormData();

    // Kiểm tra các trường quan trọng
    if (!$scope.selectedProduct.productname || !$scope.selectedProduct.unitprice || !$scope.selectedProduct.quantityinstock || 
        !$scope.selectedProduct.category || !$scope.selectedProduct.size) {
        alert('Vui lòng điền đầy đủ thông tin sản phẩm!');
        return;
    }

    // Chuyển đổi các giá trị cần thiết
    $scope.selectedProduct.unitprice = Number($scope.selectedProduct.unitprice);
    $scope.selectedProduct.quantityinstock = Number($scope.selectedProduct.quantityinstock);

    // Thêm dữ liệu sản phẩm vào FormData
    fd.append('product', JSON.stringify({
        idproduct: $scope.selectedProduct.idproduct,
        productname: $scope.selectedProduct.productname,
        category: { id: $scope.selectedProduct.category.id }, // Chỉ gửi ID của danh mục
        size: { id: $scope.selectedProduct.size.id }, // Chỉ gửi ID của kích thước
        unitprice: $scope.selectedProduct.unitprice,
        quantityinstock: $scope.selectedProduct.quantityinstock,
        description: $scope.selectedProduct.description || '', // Đảm bảo description không undefined
        isactive: $scope.selectedProduct.isactive
    }));

    // Kiểm tra xem có ảnh hay không và thêm ảnh vào FormData
    if ($scope.selectedProduct.img) {
        fd.append('file', $scope.selectedProduct.img);
    }

    // Gửi yêu cầu cập nhật
    $http.put('http://localhost:8080/beesixcake/api/productdetail/' + $scope.selectedProduct.idproduct, fd, {
        transformRequest: angular.identity,
        headers: { 'Content-Type': undefined }
    }).then(function(response) {
        $scope.loadProducts(); // Tải lại danh sách sản phẩm
        $scope.selectedProduct = {}; // Làm sạch sản phẩm đã chọn
        $scope.message = "Cập nhật sản phẩm thành công!";
        $scope.messageType = 'success';  
    }, function(error) {
        console.error('Error updating product:', error);
        $scope.message = "Cập nhật sản phẩm thất bại. Vui lòng thử lại.";
        $scope.messageType = 'error';  
    });
};

    

    // Delete product
   $scope.confirmDelete = function(id) {
    // Xác nhận xóa sản phẩm
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        // Gửi yêu cầu xóa đến API
        $http.delete('http://localhost:8080/beesixcake/api/productdetail/' + id)
            .then(function(response) {
                // Nếu thành công, tải lại danh sách sản phẩm
                $scope.loadProducts(); 
                $scope.message = "Xóa sản phẩm thành công!";
                $scope.messageType = 'success';
            }, function(error) {
                // Nếu thất bại, hiển thị thông báo lỗi
                console.error('Error deleting product:', error);
                $scope.message = "Xóa sản phẩm thất bại. Vui lòng thử lại.";
                $scope.messageType = 'error';  
            });
    }
};

     // Hàm tải dữ liệu sản phẩm
    

  


    // Initial load
    $scope.loadProducts();
    $scope.loadCategories();
    $scope.loadSizes();
    // Sau khi thêm hoặc cập nhật thành công
$scope.selectedProduct = {}; // Đặt lại form
$scope.isEditMode = false; // Đặt lại chế độ chỉnh sửa

}]);
