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

                // Định dạng lại sản phẩm yêu thích
                $scope.favoriteProducts = userFavorites.map((fav) => {
                    const product = fav.product;
                    product.img = imageBaseUrl + product.img;
                    product.unitprice = null; // Khởi tạo giá mặc định
                    return product;
                });

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
    $scope.getCategories = function () {
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
    $scope.getCategories(); // Gọi để lấy danh mục sản phẩm
});


app.controller("CheckLogin", function ($scope, $http, $window, $timeout) {
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
    // Không chuyển hướng ở đây, để người dùng vào trang index mà không cần đăng nhập
    $scope.isLoggedIn = false;
    $scope.loggedInUser = null;
  }

  // Hàm cập nhật giao diện
  $scope.updateAccountMenu = function () {
    $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
    $scope.loggedInUser = $scope.isLoggedIn
      ? JSON.parse(localStorage.getItem("loggedInUser"))
      : null;
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
              $window.location.href = "index.html";
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
    $window.location.href = "index.html"; // Chuyển về trang chính sau khi đăng xuất
  };

  // Gọi cập nhật giao diện khi controller được khởi tạo
  $scope.updateAccountMenu();
});
