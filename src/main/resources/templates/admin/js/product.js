var app = angular.module('myApp', []);
app.controller("CheckLogin", function ($scope, $http, $window) {
    // Khởi tạo thông tin người dùng và trạng thái đăng nhập
    $scope.isLoggedIn = false;
    $scope.user = {
      idaccount: "",
      password: "",
    };
    $scope.loginError = ""; // Biến để lưu thông báo lỗi
  
    // Kiểm tra trạng thái đăng nhập từ localStorage
    if (localStorage.getItem("loggedInUser")) {
      $scope.isLoggedIn = true;
      $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    } else {
      // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
      $window.location.href = "login.html"; // Đường dẫn đến trang đăng nhập
    }
  
    // Hàm cập nhật giao diện
    $scope.updateAccountMenu = function () {
      $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
    };
  
    // Phương thức đăng nhập
    $scope.login = function () {
      if (!$scope.isLoggedIn) {
        $scope.loginError = ""; // Reset thông báo lỗi
  
        // Gửi yêu cầu GET để lấy danh sách tài khoản từ API
        $http
          .get("http://localhost:8080/beesixcake/api/account")
          .then(function (response) {
            $scope.accounts = response.data;
            var foundAccount = $scope.accounts.find(
              (account) =>
                account.idaccount === $scope.user.idaccount &&
                account.password === $scope.user.password
            );
  
            if (foundAccount) {
              if (foundAccount.admin) {
                // Nếu tài khoản là admin
                $scope.loginError = "Bạn không có quyền truy cập!";
              } else {
                // Đăng nhập thành công
                $scope.loginSuccess = "Đăng nhập thành công!";
                // Lưu thông tin đăng nhập vào localStorage
                localStorage.setItem(
                  "loggedInUser",
                  JSON.stringify(foundAccount)
                );
  
                // Cập nhật giao diện
                $scope.updateAccountMenu();
  
                // Chuyển hướng về trang chính ngay lập tức
                $window.location.href = "index.html"; // Hoặc sử dụng $timeout nếu cần delay
              }
            } else {
              // Nếu tài khoản không đúng hoặc mật khẩu không khớp
              $scope.loginError = "Tên người dùng hoặc mật khẩu không đúng!";
            }
          })
          .catch(function (error) {
            // Xử lý lỗi từ API
            $scope.loginError = "Lỗi khi kết nối đến máy chủ. Vui lòng thử lại.";
            console.error("Error:", error);
          });
      } else {
        alert("Bạn đã đăng nhập rồi.");
      }
    };
  
    // Phương thức đăng xuất
    $scope.logout = function () {
      localStorage.removeItem("loggedInUser");
      $scope.isLoggedIn = false;
      $scope.loggedInUser = null;
      $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
    };
  });      
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

    // Phân trang
    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;
    $scope.totalPages = 1;
    $scope.pages = [];
    $scope.paginatedProducts = [];

    // Load products from API
    const scope = $scope;

    $scope.loadProducts = function () {
        // Sử dụng $q.all để thực hiện đồng thời hai yêu cầu HTTP
        $q.all([
            $http.get('http://localhost:8080/beesixcake/api/productdetail'),
            $http.get('http://localhost:8080/beesixcake/api/favorites')
        ]).then(function (responses) {
            var productDetails = responses[0].data;
            var favorites = responses[1].data;

            // Tạo một map để lưu số lượng yêu thích cho mỗi sản phẩm
            var favoriteCountMap = {};

            favorites.forEach(function(fav) {
                var productId = fav.product.idproduct;
                if (!favoriteCountMap[productId]) {
                    favoriteCountMap[productId] = 0;
                }
                favoriteCountMap[productId]++;
            });

            var productsMap = {};
            $scope.Products = [];

            productDetails.forEach(function(detail) {
                var productId = detail.product.idproduct;

                if (!productsMap[productId]) {
                    productsMap[productId] = {
                        idproduct: detail.product.idproduct,
                        productname: detail.product.productname,
                        category: detail.product.category,
                        description: detail.product.description,
                        img: detail.product.img,
                        isactive: detail.product.isactive,
                        favorite: favoriteCountMap[productId] || 0, // Gán số lượng yêu thích
                        sizes: []
                    };
                    $scope.Products.push(productsMap[productId]);
                }

                productsMap[productId].sizes.push({
                    idproductdetail: detail.idproductdetail,
                    idsize: detail.size.idsize,
                    sizename: detail.size.sizename,
                    unitprice: detail.unitprice,
                    quantityinstock: detail.quantityinstock
                });
            });

            console.log("Products after grouping:", $scope.Products);

            // Sắp xếp danh sách sản phẩm theo idproduct giảm dần
            $scope.Products.sort(function(a, b) {
                return b.idproduct - a.idproduct;
            });

            // Cập nhật phân trang sau khi tải sản phẩm
            $scope.updatePagination();

        }, function (error) {
            console.error('Error loading products or favorites:', error);
            $scope.message = "Lỗi khi tải sản phẩm hoặc yêu thích.";
            $scope.messageType = 'error';
        });
    };

    // Load categories from API
    scope.loadCategories = function () {
        $http.get('http://localhost:8080/beesixcake/api/category')
            .then(function (response) {
                scope.categories = response.data;
            }, function (error) {
                console.error('Error loading categories:', error);
                scope.message = "Lỗi khi tải danh mục.";
                scope.messageType = 'error';
            });
    };

    // Load sizes from API
    scope.loadSizes = function () {
        $http.get('http://localhost:8080/beesixcake/api/size')
            .then(function (response) {
                scope.sizes = response.data.map(function(size) {
                    size.isSelected = false;
                    size.unitprice = null;
                    size.quantityinstock = null;
                    return size;
                });
            }, function (error) {
                console.error('Error loading sizes:', error);
                scope.message = "Lỗi khi tải kích thước.";
                scope.messageType = 'error';
            });
    };

    // Upload image and display preview
    scope.uploadImage = function (file) {
        if (file) {
            scope.selectedProduct.img = file.name;
            var reader = new FileReader();
            reader.onload = function (event) {
                scope.$apply(function () {
                    scope.selectedProduct.imgPreview = event.target.result;
                });
            };
            reader.readAsDataURL(file);
        }
    };

    // Bộ lọc tìm kiếm
    $scope.searchFilter = function(product) {
        if (!$scope.searchQuery) {
            return true;
        }
        var query = $scope.searchQuery.toLowerCase();
        return product.productname.toLowerCase().includes(query);
    };

    // Hàm phân trang
    $scope.updatePagination = function () {
        // Áp dụng bộ lọc tìm kiếm
        if ($scope.searchQuery) {
            $scope.filteredProducts = $scope.Products.filter(function(product) {
                return product.productname.toLowerCase().includes($scope.searchQuery.toLowerCase());
            });
        } else {
            $scope.filteredProducts = $scope.Products;
        }

        // Tính tổng số trang
        $scope.totalPages = Math.ceil($scope.filteredProducts.length / $scope.itemsPerPage) || 1;

        // Tạo mảng các trang
        $scope.pages = [];
        for (var i = 1; i <= $scope.totalPages; i++) {
            $scope.pages.push(i);
        }

        // Điều chỉnh trang hiện tại nếu vượt quá tổng số trang
        if ($scope.currentPage > $scope.totalPages) {
            $scope.currentPage = $scope.totalPages;
        }

        // Lấy danh sách sản phẩm cho trang hiện tại
        var start = ($scope.currentPage - 1) * $scope.itemsPerPage;
        var end = start + $scope.itemsPerPage;
        $scope.paginatedProducts = $scope.filteredProducts.slice(start, end);
    };

    // Hàm chuyển đổi trang
    $scope.goToPage = function(page) {
        if (page < 1 || page > $scope.totalPages) {
            return;
        }
        $scope.currentPage = page;
        $scope.updatePagination();
    };

    // Watch để cập nhật phân trang khi Products hoặc searchQuery thay đổi
    $scope.$watchGroup(['Products', 'searchQuery'], function(newValues, oldValues) {
        $scope.currentPage = 1; // Reset về trang 1 khi dữ liệu thay đổi
        $scope.updatePagination();
    });

    // Thêm sản phẩm
    $scope.addProduct = function () {
        // Kiểm tra dữ liệu sản phẩm
        console.log("Dữ liệu selectedProduct trước khi thêm:", $scope.selectedProduct);

        // Xác thực dữ liệu sản phẩm
        if (!$scope.selectedProduct.productname) {
            $scope.message = "Vui lòng nhập tên sản phẩm.";
            $scope.messageType = 'error';
            console.error("Thiếu productname");
            return;
        }

        // Kiểm tra trùng tên sản phẩm (Case-insensitive)
        var duplicate = $scope.Products.some(function(product) {
            return product.productname.toLowerCase() === $scope.selectedProduct.productname.toLowerCase();
        });

        if (duplicate) {
            $scope.message = "Tên sản phẩm đã tồn tại. Vui lòng chọn tên khác.";
            $scope.messageType = 'error';
            console.error("Trùng tên sản phẩm:", $scope.selectedProduct.productname);
            return;
        }

        if (!$scope.selectedProduct.category) {
            $scope.message = "Vui lòng chọn danh mục.";
            $scope.messageType = 'error';
            console.error("Thiếu category");
            return;
        }

        if ($scope.selectedProduct.isactive === undefined) {
            $scope.message = "Vui lòng chọn trạng thái hiển thị.";
            $scope.messageType = 'error';
            console.error("Thiếu isactive");
            return;
        }

        if (!$scope.selectedProduct.sizes || $scope.selectedProduct.sizes.length === 0) {
            $scope.message = "Vui lòng chọn ít nhất một kích thước cho sản phẩm.";
            $scope.messageType = 'error';
            console.error("Không có kích thước được chọn");
            return;
        }

        // Kiểm tra đơn giá và số lượng cho từng kích thước
        for (var i = 0; i < $scope.selectedProduct.sizes.length; i++) {
            var size = $scope.selectedProduct.sizes[i];
            if (
                isNaN(size.unitprice) || isNaN(size.quantityinstock) ||
                size.unitprice <= 0 || size.quantityinstock <= 0
            ) {
                $scope.message = "Vui lòng nhập đơn giá và số lượng hợp lệ cho tất cả các kích thước đã chọn.";
                $scope.messageType = 'error';
                console.error("Giá hoặc số lượng không hợp lệ cho kích thước:", size);
                return;
            }
        }

        // Tính tổng số lượng tồn kho từ tất cả các kích thước
        var totalQuantity = $scope.selectedProduct.sizes.reduce(function(total, size) {
            return total + ((size.quantityinstock !== null && size.quantityinstock !== undefined) ? parseInt(size.quantityinstock, 10) : 0);
        }, 0);

        if (totalQuantity <= 0 || isNaN(totalQuantity)) {
            $scope.message = "Vui lòng nhập tổng số lượng tồn kho hợp lệ cho sản phẩm.";
            $scope.messageType = 'error';
            console.error("Tổng số lượng tồn kho không hợp lệ:", totalQuantity);
            return;
        }

        // Chuẩn bị dữ liệu sản phẩm mới
        var newProduct = {
            productname: $scope.selectedProduct.productname,
            description: $scope.selectedProduct.description,
            isactive: $scope.selectedProduct.isactive,
            category: {
                idcategory: $scope.selectedProduct.category.idcategory
            },
            img: $scope.selectedProduct.img,
            quantityinstock: totalQuantity,
            favorite: 0
        };

        console.log("Dữ liệu sản phẩm gửi lên backend:", newProduct);

        // Gửi yêu cầu POST để tạo sản phẩm mới
        $http.post('http://localhost:8080/beesixcake/api/product', newProduct, {
            headers: { 'Content-Type': 'application/json' }
        }).then(function (response) {
            console.log("Sản phẩm đã được tạo thành công:", response.data);
            var createdProduct = response.data;

            var detailPromises = [];

            // Tạo chi tiết sản phẩm cho từng kích thước đã chọn
            $scope.selectedProduct.sizes.forEach(function(size) {
                var newDetail = {
                    unitprice: parseFloat(size.unitprice),
                    quantityinstock: parseInt(size.quantityinstock, 10),
                    product: { idproduct: createdProduct.idproduct },
                    size: { idsize: size.idsize }
                };

                console.log("Gửi POST đến productdetail:", newDetail);

                detailPromises.push(
                    $http.post('http://localhost:8080/beesixcake/api/productdetail', newDetail, {
                        headers: { 'Content-Type': 'application/json' }
                    })
                );
            });

            // Chờ tất cả các yêu cầu POST chi tiết sản phẩm hoàn thành
            return $q.all(detailPromises).then(function(responses) {
                // Sau khi tạo chi tiết sản phẩm, thêm sản phẩm mới vào đầu danh sách Products
                createdProduct.sizes = $scope.selectedProduct.sizes.map(function(size, index) {
                    return {
                        idproductdetail: responses[index].data.idproductdetail, // Giả sử API trả về idproductdetail
                        idsize: size.idsize,
                        sizename: size.sizename,
                        unitprice: size.unitprice,
                        quantityinstock: size.quantityinstock
                    };
                });

                // Thêm sản phẩm mới vào đầu danh sách
                scope.Products.unshift(createdProduct);

                // Cập nhật phân trang
                scope.updatePagination();

                // Đặt lại form
                $scope.resetForm();

                $scope.message = "Thêm sản phẩm và chi tiết sản phẩm thành công!";
                $scope.messageType = 'success';

                // Chuyển sang tab danh sách
                var listTab = document.querySelector('#list-tab');
                if (listTab) {
                    var tab = new bootstrap.Tab(listTab);
                    tab.show();
                }
            });
        }).catch(function (error) {
            console.error('Lỗi khi thêm sản phẩm hoặc chi tiết sản phẩm:', error);
            if (error.status === 409) { // Giả sử server trả về mã 409 Conflict cho trùng tên
                $scope.message = "Tên sản phẩm đã tồn tại. Vui lòng chọn tên khác.";
            } else {
                $scope.message = "Thêm sản phẩm hoặc chi tiết sản phẩm thất bại. Vui lòng thử lại.";
            }
            $scope.messageType = 'error';
        });
    };

    // Hàm editProduct
    $scope.editProduct = function(product) {
        $scope.isEditMode = true;

        $scope.selectedProduct = {
            idproduct: product.idproduct,
            productname: product.productname,
            category: product.category,
            description: product.description,
            img: product.img,
            imgPreview: "../admin/images/" + product.img,
            isactive: product.isactive,
            favorite: product.favorite,
            sizes: []
        };

        $scope.originalSizes = angular.copy(product.sizes);

        $scope.sizes.forEach(function(size) {
            var productSize = product.sizes.find(function(ps) {
                return ps.idsize === size.idsize;
            });

            if (productSize) {
                size.isSelected = true;
                size.unitprice = productSize.unitprice;
                size.quantityinstock = productSize.quantityinstock;
                size.idproductdetail = productSize.idproductdetail;

                $scope.selectedProduct.sizes.push(size);
            } else {
                size.isSelected = false;
                size.unitprice = null;
                size.quantityinstock = null;
                delete size.idproductdetail;
            }
        });

        console.log("Editing product:", $scope.selectedProduct);

        var editTab = document.querySelector('#edit-tab');
        if (editTab) {
            var tab = new bootstrap.Tab(editTab);
            tab.show();
        }
    };

    // Hàm updateProduct
    $scope.updateProduct = function () {
        if (!$scope.selectedProduct.idproduct) {
            $scope.message = "Không tìm thấy sản phẩm để cập nhật.";
            $scope.messageType = 'error';
            return;
        }

        console.log("Dữ liệu selectedProduct.sizes trước khi map:", $scope.selectedProduct.sizes);

        var updatedProduct = {
            idproduct: $scope.selectedProduct.idproduct,
            productname: $scope.selectedProduct.productname,
            description: $scope.selectedProduct.description,
            isactive: $scope.selectedProduct.isactive !== false,
            category: {
                idcategory: $scope.selectedProduct.category.idcategory
            },
            img: $scope.selectedProduct.img,
            favorite: $scope.selectedProduct.favorite || 0,
            sizes: $scope.selectedProduct.sizes.map(function(size) {
                return {
                    idproductdetail: size.idproductdetail,
                    idsize: size.idsize,
                    sizename: size.sizename,
                    unitprice: (size.unitprice !== null && size.unitprice !== undefined) ? parseFloat(size.unitprice) : 0,
                    quantityinstock: (size.quantityinstock !== null && size.quantityinstock !== undefined) ? parseInt(size.quantityinstock, 10) : 0
                };
            }),
            quantityinstock: $scope.selectedProduct.sizes.reduce(function(total, size) {
                return total + ((size.quantityinstock !== null && size.quantityinstock !== undefined) ? parseInt(size.quantityinstock, 10) : 0);
            }, 0)
        };

        if (!updatedProduct.sizes || updatedProduct.sizes.length === 0) {
            $scope.message = "Vui lòng chọn ít nhất một kích thước cho sản phẩm.";
            $scope.messageType = 'error';
            return;
        }

        for (var i = 0; i < updatedProduct.sizes.length; i++) {
            var size = updatedProduct.sizes[i];
            console.log("Kiểm tra kích thước:", size);

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

        var quantity = updatedProduct.quantityinstock;

        console.log("Số lượng tồn kho kiểm tra:", quantity);

        if (quantity <= 0 || isNaN(quantity)) {
            console.error("Lỗi: Số lượng tồn kho sản phẩm chưa được chọn hoặc không hợp lệ.");
            $scope.message = "Vui lòng chọn số lượng tồn kho hợp lệ cho sản phẩm.";
            $scope.messageType = 'error';
            return;
        }

        console.log("Số lượng tồn kho hợp lệ:", quantity);

        $http.put('http://localhost:8080/beesixcake/api/product/' + $scope.selectedProduct.idproduct, updatedProduct, {
            headers: { 'Content-Type': 'application/json' }
        }).then(function (response) {
            console.log("Sản phẩm đã được cập nhật thành công:", response.data);

            var updatePromises = [];

            // Cập nhật và thêm kích thước
            $scope.selectedProduct.sizes.forEach(function(size) {
                if (size.idproductdetail) {
                    var updateDetail = {
                        unitprice: size.unitprice,
                        quantityinstock: size.quantityinstock,
                        size: { idsize: size.idsize },
                        product: { idproduct: updatedProduct.idproduct }
                    };

                    console.log("Gửi PUT đến productdetail:", size.idproductdetail, updateDetail);

                    updatePromises.push(
                        $http.put('http://localhost:8080/beesixcake/api/productdetail/' + size.idproductdetail, updateDetail, {
                            headers: { 'Content-Type': 'application/json' }
                        })
                    );
                } else {
                    var newDetail = {
                        unitprice: size.unitprice,
                        quantityinstock: size.quantityinstock,
                        product: { idproduct: updatedProduct.idproduct },
                        size: { idsize: size.idsize }
                    };

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

            // Chờ tất cả các promise hoàn thành
            return $q.all(updatePromises).then(function(responses) {
                // Cập nhật Products với sản phẩm đã được cập nhật
                var index = scope.Products.findIndex(p => p.idproduct === updatedProduct.idproduct);
                if (index !== -1) {
                    scope.Products[index] = updatedProduct;
                }

                // Cập nhật phân trang
                scope.updatePagination();

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
                    delete size.idproductdetail;
                });

                $scope.isEditMode = false;
                $scope.message = "Cập nhật sản phẩm và chi tiết sản phẩm thành công!";
                $scope.messageType = 'success';
            });
        }).catch(function (error) {
            console.error('Lỗi khi cập nhật sản phẩm hoặc chi tiết sản phẩm:', error);
            $scope.message = "Cập nhật sản phẩm hoặc chi tiết sản phẩm thất bại. Vui lòng thử lại.";
            $scope.messageType = 'error';
        });
    };

    // Hàm deleteProduct
    $scope.deleteProduct = function (idproduct) {
        if (!idproduct) {
            $scope.message = "Không tìm thấy sản phẩm để xóa.";
            $scope.messageType = 'error';
            return;
        }

        if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
            return;
        }

        var product = $scope.Products.find(product => product.idproduct === idproduct);
        if (!product) {
            $scope.message = "Không tìm thấy sản phẩm để xóa.";
            $scope.messageType = 'error';
            return;
        }

        var detailsToDelete = product.sizes;

        var deletePromises = [];

        detailsToDelete.forEach(function(detail) {
            deletePromises.push(
                $http.delete('http://localhost:8080/beesixcake/api/productdetail/' + detail.idproductdetail)
            );
        });

        $q.all(deletePromises).then(function () {
            return $http.delete('http://localhost:8080/beesixcake/api/product/' + idproduct);
        }).then(function (response) {
            console.log("Sản phẩm đã được xóa thành công:", response.data);
            $scope.message = "Xóa sản phẩm thành công!";
            $scope.messageType = 'success';

            // Tải lại danh sách sản phẩm sau khi xóa
            $scope.loadProducts();
        }).catch(function (error) {
            console.error('Lỗi khi xóa sản phẩm hoặc chi tiết sản phẩm:', error);
            $scope.message = "Xóa sản phẩm thất bại! Sản phẩm đã có trong đơn hàng không thể xóa!";
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

        $scope.sizes.forEach(function(size) {
            size.isSelected = false;
            size.unitprice = null;
            size.quantityinstock = null;
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
            if (!$scope.selectedProduct.sizes.includes(size)) {
                $scope.selectedProduct.sizes.push(size);
            }
        } else {
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
