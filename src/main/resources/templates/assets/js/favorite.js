var app = angular.module("myApp", []);

app.controller("FavoriteController", function ($scope, $http) {
  const API = "http://localhost:8080/beesixcake/api";
  const imageBaseUrl = "../admin/images/";

  // Khởi tạo mảng để chứa sản phẩm yêu thích
  $scope.favoriteProducts = [];
  $scope.categories = []; // Mảng lưu danh mục sản phẩm

  // Lấy người dùng đã đăng nhập từ localStorage
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  // Lấy sản phẩm yêu thích từ API
  $scope.getFavoriteProducts = function () {
    if (!loggedInUser) {
      console.warn("Người dùng chưa đăng nhập!");
      return;
    }

    $http
      .get(`${API}/favorites`)
      .then(function (response) {
        if (!Array.isArray(response.data)) {
          console.error("Dữ liệu không phải mảng!");
          return;
        }

        // Lọc sản phẩm yêu thích theo idaccount
        const userFavorites = response.data.filter(
          (fav) => fav.account.idaccount === loggedInUser.idaccount
        );

        // Định dạng lại sản phẩm yêu thích và đảo ngược danh sách
        $scope.favoriteProducts = userFavorites
          .map((fav) => {
            const product = fav.product;
            product.img = imageBaseUrl + product.img;
            product.unitprice = null; // Khởi tạo giá mặc định
            return product;
          })
          .reverse(); // Đảo ngược danh sách

        // Lấy giá thấp nhất cho các sản phẩm yêu thích
        $scope.getProductPrices();
      })
      .catch(function (error) {
        console.error("Error fetching favorite products:", error);
      });
  };

  // Lấy giá thấp nhất của sản phẩm
  $scope.getProductPrices = function () {
    $http
      .get(`${API}/productdetail`)
      .then(function (response) {
        if (!Array.isArray(response.data)) {
          console.error("Dữ liệu không phải mảng từ API chi tiết sản phẩm!");
          return;
        }

        // Tìm giá thấp nhất cho mỗi sản phẩm
        $scope.favoriteProducts.forEach((product) => {
          const productDetails = response.data.filter(
            (detail) => detail.product.idproduct === product.idproduct
          );

          if (productDetails.length > 0) {
            product.unitprice = Math.min(
              ...productDetails.map((detail) => detail.unitprice)
            ); // Tìm giá thấp nhất
          }
        });
      })
      .catch(function (error) {
        console.error("Error fetching product details:", error);
      });
  };

  // Định dạng tiền tệ
  $scope.formatCurrency = function (amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Lấy danh mục sản phẩm và số lượng
  $scope.getCategorie = function () {
    $http
      .get(`${API}/category`)
      .then((response) => {
        $scope.categories = response.data;

        // Khởi tạo số lượng sản phẩm cho mỗi danh mục
        $scope.categories.forEach((category) => {
          category.count = 0; // Mặc định là 0
        });

        // Lấy tất cả sản phẩm để tính số lượng theo danh mục
        $http
          .get(`${API}/product`)
          .then((productResponse) => {
            const products = productResponse.data;

            // Đếm số lượng sản phẩm trong từng danh mục
            products.forEach((product) => {
              const category = $scope.categories.find(
                (cat) => cat.idcategory === product.category.idcategory
              );
              if (category) category.count++;
            });
          })
          .catch((error) => {
            console.error("Error fetching products:", error);
          });
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  };

  // Gọi hàm để lấy dữ liệu ban đầu
  $scope.getFavoriteProducts();
  $scope.getCategorie(); // Gọi để lấy danh mục sản phẩm
});
app.controller("loadLoaiSanPham", function ($scope, $http) {
  // Khởi tạo mảng để chứa loại sản phẩm
  $scope.category = [];
  $scope.selectedCategory = ""; // Danh mục được chọn

  // Lấy danh mục sản phẩm
  $scope.getCategories = function () {
    $http
      .get("http://localhost:8080/beesixcake/api/category")
      .then(function (response) {
        if (Array.isArray(response.data)) {
          // Lưu danh mục vào mảng
          $scope.category = response.data.map((item) => ({
            idcategory: item.idcategory,
            categoryname: item.categoryname,
          }));
        } else {
          console.error("Dữ liệu danh mục không phải là mảng!");
        }
      })
      .catch(function (error) {
        console.error("Lỗi khi lấy danh mục sản phẩm:", error);
      });
  };

  // Lọc sản phẩm theo loại (chỉ lưu tên danh mục vào localStorage để dùng sau)
  $scope.filterProducts = function (categoryName, shouldRedirect = true) {
    $scope.selectedCategory = categoryName;

    // Lưu loại sản phẩm vào localStorage
    localStorage.setItem("selectedCategory", categoryName);

    // Chuyển hướng nếu cần
    if (shouldRedirect) {
      window.location.href = "SanPham.html"; // Chuyển đến trang sản phẩm
    }
  };

  // Gọi hàm để tải danh mục sản phẩm ban đầu
  $scope.getCategories();
});
app.controller("discountsController", function ($scope, $http) {
  const API = "http://localhost:8080/beesixcake/api";

  // Khởi tạo các biến
  $scope.Products = [];
  $scope.category = [];
  $scope.filteredProducts = []; // Mảng chứa sản phẩm đã lọc
  $scope.selectedCategory = "";
  $scope.searchQuery = ""; // Biến tìm kiếm
  $scope.productCount = 0; // Biến lưu số sản phẩm
  $scope.minPrice = null; // Biến cho giá tối thiểu
  $scope.maxPrice = null; // Biến cho giá tối đa
  // Thêm biến cho phân trang
  $scope.currentPage = 1;
  $scope.itemsPerPage = 8; // Số sản phẩm hiển thị trên mỗi trang
  $scope.totalPages = 0; // Tổng số trang
  $scope.limit = 10; // Số sản phẩm ban đầu hiển thị

  // Lấy dữ liệu từ API
  $scope.getProducts = function () {
    $http
      .get(`${API}/product`)
      .then(function (response) {
        if (!Array.isArray(response.data)) {
          console.error("Dữ liệu không phải mảng!");
          return;
        }

        // Lưu tất cả sản phẩm
        $scope.Products = response.data.map((item) => ({
          idproduct: item.idproduct,
          productname: item.productname,
          img: item.img,
          isactive: item.isactive,
          categoryname: item.category.categoryname,
        }));

        // Lấy chi tiết sản phẩm
        return $http.get(`${API}/productdetail`);
      })
      .then(function (response) {
        if (!Array.isArray(response.data)) {
          console.error("Dữ liệu không phải mảng từ API chi tiết sản phẩm!");
          return;
        }

        // Kết hợp dữ liệu chi tiết (giá) vào sản phẩm
        response.data.forEach((detail) => {
          const product = $scope.Products.find(
            (item) => item.idproduct === detail.product.idproduct
          );
          if (product) {
            product.unitprice = detail.unitprice; // Thêm giá sản phẩm
          }
        });

        // Sắp xếp sản phẩm mới theo ID từ cao đến thấp
        $scope.newProducts = $scope.Products.filter(
          (item) => item.isactive
        ).sort((a, b) => b.idproduct - a.idproduct);

        // Khởi tạo filteredProducts với tất cả sản phẩm ban đầu
        $scope.filteredProducts = $scope.newProducts;

        // Cập nhật số sản phẩm
        $scope.productCount = $scope.filteredProducts.length;

        // Tính toán tổng số trang sau khi dữ liệu đã được tải
        $scope.calculateTotalPages();

        // Nếu đã lưu loại sản phẩm trong localStorage, tự động lọc
        const storedCategory = localStorage.getItem("selectedCategory");
        if (storedCategory) {
          $scope.filterProducts(storedCategory, false); // Không chuyển hướng
          localStorage.removeItem("selectedCategory"); // Xóa sau khi load
        }
      })
      .catch(function (error) {
        console.error("Error fetching data:", error);
      });
  };
  // Hiển thị thêm sản phẩm
  $scope.showMore = function () {
    $scope.limit += 10; // Tăng số lượng sản phẩm hiển thị mỗi lần nhấn
  };

  // Tìm kiếm sản phẩm theo tên
  $scope.searchProducts = function () {
    console.log("Searching for:", $scope.searchQuery);

    // Bắt đầu với tất cả sản phẩm
    let productsToFilter = $scope.newProducts;

    // Nếu có truy vấn tìm kiếm, lọc sản phẩm theo tên
    if ($scope.searchQuery) {
      const query = $scope.searchQuery.toLowerCase();
      productsToFilter = productsToFilter.filter((product) =>
        product.productname.toLowerCase().includes(query)
      );
    }

    // Cập nhật danh sách sản phẩm đã lọc theo tên
    $scope.filteredProducts = productsToFilter;

    // Nếu đã nhập giá, lọc theo giá
    if ($scope.minPrice !== null || $scope.maxPrice !== null) {
      $scope.filteredProducts = $scope.filteredProducts.filter((product) => {
        const isWithinPriceRange =
          (isNaN($scope.minPrice) || product.unitprice >= $scope.minPrice) &&
          (isNaN($scope.maxPrice) || product.unitprice <= $scope.maxPrice);
        return isWithinPriceRange;
      });
    }

    // Cập nhật số sản phẩm và trang
    $scope.productCount = $scope.filteredProducts.length;
    $scope.calculateTotalPages();
    console.log("Filtered Products:", $scope.filteredProducts);
  };

  // Lọc sản phẩm theo loại
  $scope.filterProducts = function (categoryName, shouldRedirect = true) {
    $scope.selectedCategory = categoryName;

    // Lọc sản phẩm theo danh mục
    $scope.filteredProducts = $scope.Products.filter(
      (product) => product.categoryname === categoryName && product.isactive
    );

    $scope.productCount = $scope.filteredProducts.length; // Cập nhật số sản phẩm

    if ($scope.filteredProducts.length > 0) {
      console.log("Filtered Products:", $scope.filteredProducts);
    } else {
      console.log("Không có sản phẩm nào cho loại: " + categoryName);
    }

    // Tính toán tổng số trang sau khi lọc
    $scope.calculateTotalPages();

    // Nếu được yêu cầu, chuyển hướng đến trang sản phẩm
    if (shouldRedirect) {
      localStorage.setItem("selectedCategory", categoryName); // Lưu loại đã chọn
      window.location.href = "SanPham.html"; // Chuyển hướng
    }
  };

  // Chuyển hướng đến trang chi tiết sản phẩm
  $scope.goToProduct = function (productId) {
    if (productId) {
      const url =
        "http://127.0.0.1:5500/src/main/resources/templates/assets/chitietsanpham.html?id=" +
        productId;
      window.location.href = url;
    } else {
      console.log("Product ID is not valid.");
    }
  };
  // Navigate to the products page
  $scope.goToProductsPage = function () {
    window.location.href = "SanPham.html"; // Change this to your actual products page URL
  };

  // Định dạng tiền tệ
  $scope.formatCurrency = function (amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Lấy sản phẩm trên trang hiện tại
  $scope.getPaginatedProducts = function () {
    const start = ($scope.currentPage - 1) * $scope.itemsPerPage;
    return $scope.filteredProducts.slice(start, start + $scope.itemsPerPage);
  };

  // Chuyển trang
  $scope.changePage = function (page) {
    if (page >= 1 && page <= $scope.totalPages) {
      $scope.currentPage = page;
    }
  };

  // Tính toán tổng số trang
  $scope.calculateTotalPages = function () {
    $scope.totalPages = Math.ceil(
      $scope.filteredProducts.length / $scope.itemsPerPage
    );
  };

  // Lấy danh mục sản phẩm
  $scope.getCategories = function () {
    $http
      .get("http://localhost:8080/beesixcake/api/category")
      .then(function (response) {
        if (Array.isArray(response.data)) {
          $scope.category = response.data.map((item) => ({
            idcategory: item.idcategory,
            categoryname: item.categoryname,
          }));
        } else {
          console.error("Dữ liệu không phải mảng!");
        }
      })
      .catch(function (error) {
        console.error("Error fetching categories:", error);
      });
  };

  // Lấy danh mục và số lượng sản phẩm trong mỗi danh mục
  $scope.getCategorie = function () {
    $http
      .get(`${API}/category`)
      .then((response) => {
        $scope.categories = response.data;

        // Khởi tạo số lượng sản phẩm cho mỗi danh mục
        $scope.categories.forEach((category) => {
          category.count = 0; // Mặc định là 0
        });

        // Lấy tất cả sản phẩm để tính số lượng theo danh mục
        $http
          .get(`${API}/product`)
          .then((productResponse) => {
            const products = productResponse.data;

            // Đếm số lượng sản phẩm trong từng danh mục
            products.forEach((product) => {
              const category = $scope.categories.find(
                (cat) => cat.idcategory === product.category.idcategory
              );
              if (category) category.count++;
            });
          })
          .catch((error) => {
            console.error("Error fetching products:", error);
          });
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  };

  // Gọi để lấy danh mục sản phẩm
  $scope.getCategorie();
  // Khởi động ứng dụng
  $scope.getProducts(); // Gọi hàm để lấy dữ liệu ban đầu
  $scope.getCategories(); // Lấy danh mục sản phẩm

  // Theo dõi thay đổi trong searchQuery để tìm kiếm
  $scope.$watch("searchQuery", function (newValue, oldValue) {
    if (newValue !== oldValue) {
      $scope.searchProducts(); // Gọi hàm tìm kiếm khi có thay đổi
    }
  });
});
app.controller("CheckLogin", function ($scope, $http, $window, $timeout) {
  $scope.isLoggedIn = false;
  $scope.user = { idaccount: "", password: "" };
  $scope.loginError = "";

  // Kiểm tra người dùng đã đăng nhập chưa
  if (localStorage.getItem("loggedInUser")) {
    $scope.isLoggedIn = true;
    $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  } else {
    $window.location.href = "login.html"; // Chuyển đến trang đăng nhập nếu chưa đăng nhập
  }

  // Cập nhật giao diện theo trạng thái đăng nhập
  $scope.updateAccountMenu = function () {
    $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
  };

  // Đăng nhập
  $scope.login = function () {
    if (!$scope.isLoggedIn) {
      $scope.loginError = ""; // Reset thông báo lỗi

      // Gửi yêu cầu để lấy danh sách tài khoản
      $http
        .get("http://localhost:8080/beesixcake/api/account")
        .then(function (response) {
          $scope.accounts = response.data;
          const foundAccount = $scope.accounts.find(
            (account) =>
              account.idaccount === $scope.user.idaccount &&
              account.password === $scope.user.password
          );

          if (foundAccount) {
            if (foundAccount.admin) {
              $scope.loginError = "Bạn không có quyền truy cập!";
            } else {
              $scope.loginSuccess = "Đăng nhập thành công!";
              localStorage.setItem(
                "loggedInUser",
                JSON.stringify(foundAccount)
              );
              $scope.updateAccountMenu();
              $window.location.href = "index.html"; // Chuyển đến trang chính sau khi đăng nhập thành công
            }
          } else {
            $scope.loginError = "Tên người dùng hoặc mật khẩu không đúng!";
          }
        })
        .catch(function (error) {
          $scope.loginError = "Lỗi khi kết nối đến máy chủ. Vui lòng thử lại.";
          console.error("Error:", error);
        });
    } else {
      alert("Bạn đã đăng nhập rồi.");
    }
  };

  // Đăng xuất
  $scope.logout = function () {
    localStorage.removeItem("loggedInUser");
    $scope.isLoggedIn = false;
    $scope.loggedInUser = null;
    $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
  };
});
