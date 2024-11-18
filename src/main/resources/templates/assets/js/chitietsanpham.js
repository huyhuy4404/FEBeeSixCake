var app = angular.module("myApp", []);

app.controller("ProductDetailController", function ($scope, $http) {
  const API = "http://localhost:8080/beesixcake/api";
  const imageBaseUrl = "https://5ck6jg.csb.app/anh/";
  var urlParams = new URLSearchParams(window.location.search);
  var productId = urlParams.get("id");

  // Kiểm tra nếu có productId
  if (productId) {
    // Gọi API để lấy thông tin sản phẩm
    $http
      .get(`${API}/product/${productId}`)
      .then(function (response) {
        $scope.product = response.data;
        $scope.product.img = imageBaseUrl + $scope.product.img.split("/").pop();
      })
      .catch(function (error) {
        console.error("Error fetching product:", error);
      });

    // Gọi API để lấy chi tiết sản phẩm
    $http
      .get(`${API}/productdetail`)
      .then(function (response) {
        $scope.productDetails = response.data.filter(
          (detail) => detail.product.idproduct == productId
        );

        $scope.productDetails.forEach((detail) => {
          detail.product.img =
            imageBaseUrl + detail.product.img.split("/").pop();
        });

        $scope.selectedSizeDetail =
          $scope.productDetails.find((detail) => detail.size.idsize === 1) ||
          $scope.productDetails[0];
        $scope.selectedSize = $scope.selectedSizeDetail.size.sizename;
        $scope.quantity = 1;
        $scope.maxQuantity = $scope.selectedSizeDetail.quantityinstock;
      })
      .catch(function (error) {
        console.error("Error fetching product details:", error);
      });

    // Lấy thông tin giỏ hàng từ API
    $http
      .get(`${API}/shoppingcart`)
      .then(function (response) {
        const shoppingCarts = response.data;
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
        $scope.currentUserShoppingCart = shoppingCarts.find(
          (cart) => cart.account.idaccount === loggedInUser.idaccount
        );
      })
      .catch(function (error) {
        console.error("Error fetching shopping cart:", error);
      });
  } else {
    console.error("Product ID is missing from the URL");
  }

  // Thêm sản phẩm vào giỏ hàng
  $scope.addToCart = function () {
    if (!$scope.currentUserShoppingCart) {
      alert("Giỏ hàng không tồn tại. Vui lòng đăng nhập lại.");
      return;
    }

    // Kiểm tra số lượng hợp lệ
    if ($scope.quantity < 1 || $scope.quantity > $scope.maxQuantity) {
      alert("Số lượng không hợp lệ!");
      return;
    }

    // Chuẩn bị dữ liệu để gửi lên API
    const cartItem = {
      quantity: $scope.quantity,
      productdetail: {
        idproductdetail: $scope.selectedSizeDetail.idproductdetail,
      },
      shoppingcart: {
        idshoppingcart: $scope.currentUserShoppingCart.idshoppingcart,
      },
    };

    // Gửi yêu cầu POST tới API /cartitems
    $http
      .post(`${API}/cartitems`, cartItem)
      .then(function (response) {
        alert("Thêm sản phẩm vào giỏ hàng thành công!");
      })
      .catch(function (error) {
        console.error("Error adding to cart:", error);
        alert("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
      });
  };

  // Thay đổi kích cỡ
  $scope.selectSize = function (sizename) {
    $scope.selectedSize = sizename;
    $scope.selectedSizeDetail = $scope.productDetails.find(
      (detail) => detail.size.sizename === sizename
    );
    $scope.maxQuantity = $scope.selectedSizeDetail.quantityinstock || 1;
    $scope.quantity = 1; // Đặt lại số lượng về 1 khi thay đổi kích cỡ
  };

  // Yêu thích (toggle heart icon)
  $scope.isActive = false; // Khởi tạo biến trạng thái
  $scope.toggleHeart = function () {
    $scope.isActive = !$scope.isActive; // Đảo ngược trạng thái khi nhấn nút
  };

  // Giảm số lượng sản phẩm
  $scope.decreaseQuantity = function () {
    if ($scope.quantity > 1) {
      $scope.quantity--;
    }
  };

  // Tăng số lượng sản phẩm
  $scope.increaseQuantity = function () {
    if ($scope.quantity < $scope.maxQuantity) {
      $scope.quantity++;
    }
  };

  // Cập nhật số lượng sản phẩm khi người dùng thay đổi giá trị
  $scope.updateQuantity = function () {
    $scope.quantity = parseInt($scope.quantity);
    if ($scope.quantity > $scope.maxQuantity) {
      $scope.quantity = $scope.maxQuantity;
    } else if ($scope.quantity < 1) {
      $scope.quantity = 1;
    }
  };

  // Hàm chuyển hướng đến trang giỏ hàng
  $scope.goToCart = function (productdetailId) {
    if (productdetailId) {
      const url =
        "http://127.0.0.1:5500/src/main/resources/templates/assets/giohang.html?id=" +
        productdetailId;
      window.location.href = url;
    } else {
      console.log("Product ID is not valid.");
    }
  };

   // Tải danh mục sản phẩm từ API
   $http.get(`${API}/category`)
   .then(function (response) {
     $scope.categories = response.data;
     // Tính số lượng sản phẩm cho mỗi danh mục
     $scope.categories.forEach(function (category) {
       category.count = 0;  // Khởi tạo count với giá trị ban đầu là 0
     });

     // Tải danh sách sản phẩm
     $http.get(`${API}/product`)
       .then(function (productResponse) {
         const products = productResponse.data;
         // Đếm số lượng sản phẩm cho mỗi danh mục
         products.forEach(function (product) {
           const category = $scope.categories.find(
             cat => cat.idcategory === product.category.idcategory
           );
           if (category) {
             category.count += 1;
           }
         });
       })
       .catch(function (error) {
         console.error("Error fetching products:", error);
       });
   })
   .catch(function (error) {
     console.error("Error fetching categories:", error);
   });

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

