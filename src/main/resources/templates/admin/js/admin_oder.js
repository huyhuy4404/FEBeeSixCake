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

  app.controller('Admin-oder', ['$scope', '$http', '$q', function ($scope, $http, $q) {
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
    
            // Sắp xếp danh sách sản phẩm theo idproduct giảm dần
            $scope.Products.sort(function(a, b) {
                return b.idproduct - a.idproduct;
            });
    
            // Chọn kích thước đầu tiên cho mỗi sản phẩm và gán giá trị cho selectedQuantity
            $scope.Products.forEach(function(product) {
                if (product.sizes && product.sizes.length > 0) {
                    var firstSize = product.sizes[0];
                    product.selectedSize = firstSize;
                    product.unitprice = firstSize.unitprice;
                    product.quantityinstock = firstSize.quantityinstock;
                    product.selectedQuantity = 1;
                }
            });
    
            // Sau khi tải xong sản phẩm, gọi filterByCategory để lọc theo loại đã chọn (nếu có)
            $scope.filterByCategory();
    
        }, function (error) {
            console.error('Error loading products or favorites:', error);
            $scope.message = "Lỗi khi tải sản phẩm hoặc yêu thích.";
            $scope.messageType = 'error';
        });
    };
    
    // Lọc sản phẩm theo loại sản phẩm, tìm kiếm và giá tối đa
    $scope.filterByCategory = function () {
        console.log("Selected Category:", $scope.selectedCategory); // Kiểm tra giá trị của selectedCategory
        $scope.filteredProducts = $scope.Products.filter(function (product) {
            console.log("Product Category:", product.category.idcategory); // Kiểm tra giá trị của product.category.idcategory
            let matchesCategory = !$scope.selectedCategory || product.category.idcategory === $scope.selectedCategory;
            let matchesSearchQuery = !$scope.searchQuery || product.productname.toLowerCase().includes($scope.searchQuery.toLowerCase());
            let matchesMaxPrice = !$scope.maxPrice || product.unitprice <= $scope.maxPrice;
            return matchesCategory && matchesSearchQuery && matchesMaxPrice;
        });
    
        // Cập nhật phân trang sau khi lọc
        $scope.updatePagination();
    };
    
    $scope.updatePagination = function () {
        // Nếu có bộ lọc, sử dụng filteredProducts, nếu không thì sử dụng tất cả các sản phẩm
        let productsToPaginate = $scope.filteredProducts || $scope.Products;
    
        // Tính tổng số trang
        $scope.totalPages = Math.ceil(productsToPaginate.length / $scope.itemsPerPage) || 1;
    
        // Tạo mảng các trang
        $scope.pages = [];
        for (let i = 1; i <= $scope.totalPages; i++) {
            $scope.pages.push(i);
        }
    
        // Điều chỉnh trang hiện tại nếu vượt quá tổng số trang
        if ($scope.currentPage > $scope.totalPages) {
            $scope.currentPage = $scope.totalPages;
        }
    
        // Lấy danh sách sản phẩm cho trang hiện tại
        let start = ($scope.currentPage - 1) * $scope.itemsPerPage;
        let end = start + $scope.itemsPerPage;
        $scope.paginatedProducts = productsToPaginate.slice(start, end);
    };
    
   
    
    
    // Load categories from API
    $scope.loadCategories = function () {
        $http.get('http://localhost:8080/beesixcake/api/category')
            .then(function (response) {
                $scope.categories = response.data;
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
                    size.quantityinstock = null;
                    return size;
                });
            }, function (error) {
                console.error('Error loading sizes:', error);
                $scope.message = "Lỗi khi tải kích thước.";
                $scope.messageType = 'error';
            });
    };

    // Hàm thay đổi kích thước và cập nhật giá và số lượng
    $scope.onSizeChange = function (product, selectedSize) {
        var size = product.sizes.find(function (s) {
            return s.idsize === selectedSize.idsize;
        });

        if (size) {
            product.selectedSize = size;
            product.unitprice = size.unitprice;
            product.quantityinstock = size.quantityinstock;
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
    $scope.onQuantityChange = function(product) {
        // Kiểm tra nếu giá trị nhập vào là rỗng, thì đặt lại về số 1 (hoặc giá trị mặc định)
        if (product.selectedQuantity === "") {
            product.selectedQuantity = '';
            return; // Dừng xử lý thêm, không cần cảnh báo
        }
    
        // Kiểm tra nếu số lượng người dùng nhập lớn hơn số lượng tồn kho
        if (product.selectedQuantity > product.quantityinstock) {
            // Nếu lớn hơn, reset lại số lượng về số lượng trong kho
            product.selectedQuantity = product.quantityinstock;
            showModal("Số lượng không thể vượt quá số lượng trong kho.", "warning");
        } 
        // Kiểm tra nếu người dùng nhập số âm hoặc số bằng 0
        else if (product.selectedQuantity < 1) {
            // Nếu người dùng nhập số âm hoặc số bằng 0, set lại về 1
            product.selectedQuantity = 1;
            showModal("Số lượng không thể là số âm hoặc bằng 0.", "warning");
        }
    };
    
    // Hàm hiển thị modal
    function showModal(message, type) {
        $scope.message = message;
        $scope.messageType = type;
        
        // Lấy phần tử modal và hiển thị nó
        var modalElement = document.getElementById('messageModal');
        if (modalElement) {
            var modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }
    
    
    $scope.toggleOrderStatus = function(product) {
        // Đảo ngược trạng thái của sản phẩm (chuyển đổi giữa đã thêm vào đơn hàng và chưa)
        product.isAdded = !product.isAdded;
    
        // Thực hiện các hành động bổ sung nếu cần khi sản phẩm được thêm hoặc bỏ khỏi đơn hàng
        if (product.isAdded) {
            showModal("Sản phẩm đã được thêm vào đơn hàng!", "success");
        } else {
            showModal("Sản phẩm đã được loại bỏ khỏi đơn hàng!", "warning");
        }
    };
    


    // Hàm hiển thị modal
    function showModal(message, type) {
        $scope.message = message;
        $scope.messageType = type;
    
        // Lấy phần tử modal và hiển thị nó
        var modalElement = document.getElementById('messageModal');
        if (modalElement) {
            var modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }
    $scope.updatePagination = function () {
        // Nếu có bộ lọc, sử dụng filteredProducts, nếu không thì sử dụng tất cả các sản phẩm
        let productsToPaginate = $scope.filteredProducts || $scope.Products;
    
        // Tính tổng số trang
        $scope.totalPages = Math.ceil(productsToPaginate.length / $scope.itemsPerPage) || 1;
    
        // Tạo mảng các trang
        $scope.pages = [];
        for (let i = 1; i <= $scope.totalPages; i++) {
            $scope.pages.push(i);
        }
    
        // Điều chỉnh trang hiện tại nếu vượt quá tổng số trang
        if ($scope.currentPage > $scope.totalPages) {
            $scope.currentPage = $scope.totalPages;
        }
    
        // Lấy danh sách sản phẩm cho trang hiện tại
        let start = ($scope.currentPage - 1) * $scope.itemsPerPage;
        let end = start + $scope.itemsPerPage;
        $scope.paginatedProducts = productsToPaginate.slice(start, end);
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
    
    // Hàm hiển thị modal
    function showModal(message, type) {
        $scope.message = message;
        $scope.messageType = type;
    
        // Lấy phần tử modal và hiển thị nó
        var modalElement = document.getElementById('messageModal');
        if (modalElement) {
            var modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    // Hàm load initial data
    $scope.loadInitialData = function () {
        $scope.loadCategories();
        $scope.loadSizes();
        $scope.loadProducts();
    };

    // Gọi hàm load initial data khi controller được khởi tạo
    $scope.loadInitialData();
}]);
