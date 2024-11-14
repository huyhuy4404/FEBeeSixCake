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

// Custom Filter for truncating text
app.filter('truncate', function() {
    return function(input, limit) {
        if (!input) return '';
        if (input.length <= limit) return input;
        return input.substring(0, limit) + '...';
    };
});

app.controller('ProController', ['$scope', '$http', '$q', function ($scope, $http, $q) {
    $scope.Products = [];
    $scope.selectedProduct = {
        category: null,
        sizes: []
    };
    $scope.categories = [];
    $scope.sizes = [];
    $scope.message = '';
    $scope.messageType = '';
    $scope.isEditMode = false;
    $scope.originalSizes = [];

// Load products from API

$scope.loadProducts = function () {
    $http.get('http://localhost:8080/beesixcake/api/productdetail')
        .then(function (response) {
            console.log("API Response:", response.data); // Kiểm tra dữ liệu
            var productDetails = response.data; // Mảng các chi tiết sản phẩm
            var productsMap = {}; // Map để nhóm sản phẩm

            $scope.Products = []; // Reset danh sách sản phẩm

            productDetails.forEach(function(detail) {
                var productId = detail.product.idproduct;

                if (!productsMap[productId]) {
                    // Nếu chưa có sản phẩm trong map, thêm mới
                    productsMap[productId] = {
                        idproduct: detail.product.idproduct,
                        productname: detail.product.productname,
                        category: detail.product.category,
                        description: detail.product.description,
                        img: detail.product.img,
                        isactive: detail.product.isactive,
                        sizes: [] // Mảng kích thước cho sản phẩm này
                    };
                    $scope.Products.push(productsMap[productId]);
                }

                // Thêm kích thước vào sản phẩm tương ứng
                productsMap[productId].sizes.push({
                    idproductdetail: detail.idproductdetail,
                    idsize: detail.size.idsize,
                    sizename: detail.size.sizename,
                    unitprice: detail.unitprice,
                    quantityinstock: detail.quantityinstock // Chắc chắn rằng quantityinstock được gán đúng
                });
            });

            console.log("Products after grouping:", $scope.Products);
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
            $scope.sizes = response.data.map(function(size) {
                size.isSelected = false;
                size.unitprice = null;
                size.quantityinstock = null; // Sử dụng quantityinstock thay cho quantity
                return size;
            });
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

$scope.addProduct = function () {
    // Kiểm tra tên sản phẩm
    if (!$scope.selectedProduct.productname || $scope.selectedProduct.productname.trim() === '') {
        $scope.message = "Vui lòng nhập tên sản phẩm.";
        $scope.messageType = 'error';
        return;
    }

    // Kiểm tra kích thước đã chọn
    if (!$scope.selectedProduct.sizes || $scope.selectedProduct.sizes.length === 0) {
        $scope.message = "Vui lòng chọn ít nhất một kích thước cho sản phẩm.";
        $scope.messageType = 'error';
        return;
    }

    // Kiểm tra giá và số lượng của từng kích thước
    for (let i = 0; i < $scope.selectedProduct.sizes.length; i++) {
        const size = $scope.selectedProduct.sizes[i];
        if (!size.unitprice || !size.quantityinstock || isNaN(size.unitprice) || isNaN(size.quantityinstock) || size.unitprice <= 0 || size.quantityinstock <= 0) {
            $scope.message = "Vui lòng nhập đơn giá và số lượng hợp lệ cho tất cả các kích thước đã chọn.";
            $scope.messageType = 'error';
            return;
        }
    }

    // Kiểm tra danh mục
    if (!$scope.selectedProduct.category || !$scope.selectedProduct.category.idcategory) {
        $scope.message = "Vui lòng chọn danh mục cho sản phẩm.";
        $scope.messageType = 'error';
        return;
    }

    // Tạo đối tượng sản phẩm mới
    const newProduct = {
        productname: $scope.selectedProduct.productname,
        img: $scope.selectedProduct.img || '',
        description: $scope.selectedProduct.description || '',
        isactive: $scope.selectedProduct.isactive !== false,
        category: { idcategory: $scope.selectedProduct.category.idcategory },
        sizes: $scope.selectedProduct.sizes.map(size => ({
            idsize: size.idsize || null,
            unitprice: parseFloat(size.unitprice),
            quantityinstock: parseInt(size.quantityinstock, 10)
        })),
        quantityinstock: $scope.selectedProduct.sizes.reduce((total, size) => total + parseInt(size.quantityinstock || 0, 10), 0)
    };

    // Ghi log dữ liệu sản phẩm để kiểm tra trước khi gửi
    console.log("Dữ liệu sản phẩm trước khi gửi:", newProduct);

    // Xác nhận số lượng tồn kho hợp lệ
    if (newProduct.quantityinstock <= 0 || isNaN(newProduct.quantityinstock)) {
        console.error("Lỗi: Số lượng tồn kho sản phẩm chưa được chọn hoặc không hợp lệ.");
        $scope.message = "Vui lòng chọn số lượng tồn kho hợp lệ cho sản phẩm.";
        $scope.messageType = 'error';
        return;
    }

    // Gửi dữ liệu đến API
    $http.post('http://localhost:8080/beesixcake/api/product', newProduct, {
        headers: { 'Content-Type': 'application/json' }
    }).then(response => {
        console.log("Sản phẩm đã được thêm thành công:", response.data);
        $scope.loadProducts();

        // Đặt lại form
        $scope.selectedProduct = { category: null, sizes: [], description: '', productname: '', img: '', isactive: true };
        $scope.sizes.forEach(size => {
            size.isSelected = false;
            size.unitprice = null;
            size.quantityinstock = null;
        });

        $scope.message = "Thêm sản phẩm và chi tiết sản phẩm thành công!";
        $scope.messageType = 'success';

    }).catch(error => {
        console.error('Lỗi khi thêm sản phẩm hoặc chi tiết sản phẩm:', error);
        console.error('Lỗi chi tiết:', error.data); // Chi tiết lỗi từ server
        $scope.message = "Thêm sản phẩm hoặc chi tiết sản phẩm thất bại. Vui lòng thử lại.";
        $scope.messageType = 'error';
    });
};




// Hàm chỉnh sửa sản phẩm
$scope.editProduct = function(product) {
    $scope.isEditMode = true; // Đặt chế độ chỉnh sửa

    // Sao chép dữ liệu sản phẩm vào selectedProduct
    $scope.selectedProduct = {
        idproduct: product.idproduct, // Thêm ID sản phẩm để cập nhật
        productname: product.productname,
        category: product.category,
        description: product.description,
        img: product.img,
        isactive: product.isactive,
        sizes: [] // Mảng kích thước sẽ được điền dưới đây
    };

    // Lưu trữ các kích thước gốc để xử lý việc xóa sau này
    $scope.originalSizes = angular.copy(product.sizes);

    // Đánh dấu các kích thước đã chọn và điền giá và số lượng
    $scope.sizes.forEach(function(size) {
        var productSize = product.sizes.find(function(ps) {
            return ps.idsize === size.idsize;
        });

        if (productSize) {
            size.isSelected = true;
            size.unitprice = productSize.unitprice;
            size.quantityinstock = productSize.quantityinstock;
            size.idproductdetail = productSize.idproductdetail; // Thêm idproductdetail vào đối tượng kích thước

            // Thêm kích thước vào selectedProduct.sizes bằng cách tham chiếu
            $scope.selectedProduct.sizes.push(size);
        } else {
            size.isSelected = false;
            size.unitprice = null;
            size.quantityinstock = null;
            delete size.idproductdetail; // Loại bỏ idproductdetail nếu kích thước chưa tồn tại cho sản phẩm này
        }
    });

    console.log("Editing product:", $scope.selectedProduct);
};


$scope.updateProduct = function () {
    if (!$scope.selectedProduct.idproduct) {
        $scope.message = "Không tìm thấy sản phẩm để cập nhật.";
        $scope.messageType = 'error';
        return;
    }

    // Thêm log để kiểm tra dữ liệu trước khi map
    console.log("Dữ liệu selectedProduct.sizes trước khi map:", $scope.selectedProduct.sizes);

    // Chuyển đổi các giá trị unitprice và quantityinstock thành số, tránh NaN
    var updatedProduct = {
        idproduct: $scope.selectedProduct.idproduct,
        productname: $scope.selectedProduct.productname,
        description: $scope.selectedProduct.description,
        isactive: $scope.selectedProduct.isactive !== false,
        category: {
            idcategory: $scope.selectedProduct.category.idcategory
        },
        img: $scope.selectedProduct.img,
        sizes: $scope.selectedProduct.sizes.map(function(size) {
            return {
                idproductdetail: size.idproductdetail, // Có thể là undefined cho kích thước mới
                idsize: size.idsize,
                unitprice: (size.unitprice !== null && size.unitprice !== undefined) ? parseFloat(size.unitprice) : 0,
                quantityinstock: (size.quantityinstock !== null && size.quantityinstock !== undefined) ? parseInt(size.quantityinstock, 10) : 0
            };
        }),
        quantityinstock: $scope.selectedProduct.sizes.reduce(function(total, size) {
            return total + ((size.quantityinstock !== null && size.quantityinstock !== undefined) ? parseInt(size.quantityinstock, 10) : 0);
        }, 0)
    };

    // Kiểm tra nếu không có kích thước nào được chọn
    if (!updatedProduct.sizes || updatedProduct.sizes.length === 0) {
        $scope.message = "Vui lòng chọn ít nhất một kích thước cho sản phẩm.";
        $scope.messageType = 'error';
        return;
    }

    // Kiểm tra tất cả các kích thước đã chọn có đơn giá và số lượng hợp lệ
    for (var i = 0; i < updatedProduct.sizes.length; i++) {
        var size = updatedProduct.sizes[i];
        console.log("Kiểm tra kích thước:", size); // Thêm logging để kiểm tra

        if (
            isNaN(size.unitprice) || isNaN(size.quantityinstock) ||
            size.unitprice <= 0 || size.quantityinstock <= 0
        ) {
            console.error("Lỗi: Kích thước không hợp lệ:", size);
            $scope.message = "Vui lòng nhập đơn giá và số lượng cho tất cả các kích thước đã chọn, và đảm bảo rằng chúng là số dương.";
            $scope.messageType = 'error';
            return;
        }
    }

    // Tính tổng số lượng tồn kho từ tất cả các kích thước
    var quantity = updatedProduct.quantityinstock;

    console.log("Số lượng tồn kho kiểm tra:", quantity);

    if (quantity <= 0 || isNaN(quantity)) {
        console.error("Lỗi: Số lượng tồn kho sản phẩm chưa được chọn hoặc không hợp lệ.");
        $scope.message = "Vui lòng chọn số lượng tồn kho hợp lệ cho sản phẩm.";
        $scope.messageType = 'error';
        return;
    }

    console.log("Số lượng tồn kho hợp lệ:", quantity);

    // Gửi JSON data đến API để cập nhật sản phẩm
    $http.put('http://localhost:8080/beesixcake/api/product/' + $scope.selectedProduct.idproduct, updatedProduct, {
        headers: { 'Content-Type': 'application/json' }
    }).then(function (response) {
        console.log("Sản phẩm đã được cập nhật thành công:", response.data);

        var updatePromises = [];

        // Cập nhật và thêm kích thước
        $scope.selectedProduct.sizes.forEach(function(size) {
            if (size.idproductdetail) {
                // Kích thước đã tồn tại, cập nhật nó
                var updateDetail = {
                    unitprice: size.unitprice,
                    quantityinstock: size.quantityinstock,
                    size: { idsize: size.idsize },
                    product: { idproduct: updatedProduct.idproduct }
                };

                // Log dữ liệu được gửi
                console.log("Gửi PUT đến productdetail:", size.idproductdetail, updateDetail);

                updatePromises.push(
                    $http.put('http://localhost:8080/beesixcake/api/productdetail/' + size.idproductdetail, updateDetail, {
                        headers: { 'Content-Type': 'application/json' }
                    })
                );
            } else {
                // Kích thước mới, thêm nó
                var newDetail = {
                    unitprice: size.unitprice,
                    quantityinstock: size.quantityinstock,
                    product: { idproduct: updatedProduct.idproduct },
                    size: { idsize: size.idsize }
                };

                // Log dữ liệu được gửi
                console.log("Gửi POST đến productdetail:", newDetail);

                updatePromises.push(
                    $http.post('http://localhost:8080/beesixcake/api/productdetail', newDetail, {
                        headers: { 'Content-Type': 'application/json' }
                    })
                );
            }
        });

        // Xác định các kích thước đã bị loại bỏ
        var originalSizeIds = $scope.originalSizes.map(function(size) { return size.idsize; });
        var selectedSizeIds = $scope.selectedProduct.sizes.map(function(size) { return size.idsize; });
        var sizesToDelete = $scope.originalSizes.filter(function(size) {
            return !selectedSizeIds.includes(size.idsize);
        });

        sizesToDelete.forEach(function(size) {
            console.log("Gửi DELETE đến productdetail:", size.idproductdetail);
            updatePromises.push(
                $http.delete('http://localhost:8080/beesixcake/api/productdetail/' + size.idproductdetail)
            );
        });

        // Sử dụng $q.all để chờ tất cả các promise hoàn thành
        return $q.all(updatePromises);
    }).then(function (responses) {
        console.log("Chi tiết sản phẩm đã được cập nhật thành công:", responses);
        $scope.loadProducts(); // Tải lại danh sách sản phẩm

        // Đặt lại form
        $scope.selectedProduct = {
            category: null,
            sizes: []
        };

        // Đặt lại trạng thái của các kích thước
        $scope.sizes.forEach(function(size) {
            size.isSelected = false;
            size.unitprice = null;
            size.quantityinstock = null;
            delete size.idproductdetail; // Loại bỏ idproductdetail nếu có
        });

        $scope.isEditMode = false; // Thoát chế độ chỉnh sửa
        $scope.message = "Cập nhật sản phẩm và chi tiết sản phẩm thành công!";
        $scope.messageType = 'success';

    }).catch(function (error) {
        console.error('Lỗi khi cập nhật sản phẩm hoặc chi tiết sản phẩm:', error);
        $scope.message = "Cập nhật sản phẩm hoặc chi tiết sản phẩm thất bại. Vui lòng thử lại.";
        $scope.messageType = 'error';
    });
};


$scope.deleteProduct = function (productId) {
    console.log("ID sản phẩm cần xóa:", productId);

    if (!productId) {
        console.error("Lỗi: Không tìm thấy sản phẩm để xóa.");
        $scope.message = "Lỗi: Không tìm thấy sản phẩm để xóa.";
        $scope.messageType = 'error';
        return;
    }

    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
        return;
    }

    $http.delete('http://localhost:8080/beesixcake/api/product/' + productId, {
        headers: { 'Content-Type': 'application/json' }
    }).then(function (response) {
        if (response.status === 200) {
            console.log("Sản phẩm đã được xóa thành công:", response.data);
            $scope.loadProducts(); 

            $scope.message = "Xóa sản phẩm thành công!";
            $scope.messageType = 'success';
        } else {
            throw new Error("Lỗi khi xóa sản phẩm: Mã trạng thái không thành công");
        }
    }).catch(function (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        if (error.status === 500) {
            $scope.message = "Lỗi từ máy chủ: Không thể xóa sản phẩm. Vui lòng kiểm tra dữ liệu hoặc liên hệ bộ phận kỹ thuật.";
        } else {
            $scope.message = "Lỗi: Xóa sản phẩm thất bại. Vui lòng thử lại.";
        }
        $scope.messageType = 'error';
    });
};





    // Hàm reset form
    $scope.resetForm = function() {
        $scope.selectedProduct = {
            category: null,
            sizes: []
        };
        $scope.isEditMode = false;
        $scope.message = '';
        $scope.messageType = '';

        // Đặt lại trạng thái của các kích thước
        $scope.sizes.forEach(function(size) {
            size.isSelected = false;
            size.unitprice = null;
            size.quantityinstock = null; // Sử dụng quantityinstock thay cho quantity
        });
    };

    // Hàm load initial data
    $scope.loadInitialData = function () {
        $scope.loadCategories();
        $scope.loadSizes();
        $scope.loadProducts();
    };

    // Gọi hàm load initial data khi controller được khởi tạo
    $scope.loadInitialData();

// Hàm log khi chọn kích thước
$scope.logSelectedSize = function(size) {
    if (size.isSelected) {
        // Thêm kích thước vào selectedProduct.sizes nếu chưa có
        if (!$scope.selectedProduct.sizes.includes(size)) {
            $scope.selectedProduct.sizes.push(size);
        }
    } else {
        // Loại bỏ kích thước khỏi selectedProduct.sizes
        $scope.selectedProduct.sizes = $scope.selectedProduct.sizes.filter(s => s !== size);
    }
};


    // Hàm log khi thay đổi giá
    $scope.logPriceChange = function(size) {
        console.log("Price changed for size:", size);
    };

    // Hàm log khi thay đổi số lượng
    $scope.logQuantityChange = function(size) {
        console.log("Quantity changed for size:", size);
    };

}]);
