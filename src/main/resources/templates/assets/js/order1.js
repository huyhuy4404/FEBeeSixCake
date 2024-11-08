// app.controller('CartController', ['$scope', '$http', function ($scope, $http) {
//     $scope.products = [];
//     $scope.addresses = [];
//     $scope.account = {}; // Thông tin người mua hàng
//     $scope.totalPrice = 0;

//     // Hàm định dạng tiền tệ

//     $scope.formatCurrency = function (amount) {
//         return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
//     };
//     // Lấy thông tin người mua hàng từ API
//     $http.get('http://localhost:8080/beesixcake/api/account') // Thay đổi URL cho đúng
//         .then(function (response) {
//             $scope.account = response.data; // Dữ liệu trả về là đối tượng người mua
//         })
//         .catch(function (error) {
//             console.error('Error fetching buyer info:', error);
//         });

//     // Lấy dữ liệu từ API sản phẩm
//     $http.get('http://localhost:8080/beesixcake/api/productdetail')
//         .then(function (response) {
//             $scope.products = response.data.map(function (item) {
//                 return {
//                     id: item.product.idproduct, // ID sản phẩm
//                     name: item.product.productname, // Tên sản phẩm
//                     img: item.product.img, // Hình ảnh sản phẩm
//                     categoryName: item.product.category.categoryname, // Tên loại sản phẩm
//                     sz: item.size.sizename, // Kích cỡ
//                     price: item.unitprice, // Giá sản phẩm
//                     quantity: 1,
//                     // quantity: item.quantityinstock, // Số lượng trong kho
//                     description: item.product.description // Mô tả sản phẩm
//                 };
//             });

//             $scope.calculateTotal(); // Tính tổng giá sau khi lấy sản phẩm
//         })
//         .catch(function (error) {
//             console.error('Error fetching product details:', error);
//         });

//     // Lấy địa chỉ
//     $http.get('http://localhost:8080/beesixcake/api/address')
//         .then(function (response) {
//             $scope.addresses = response.data.map(function (item) {
//                 return {
//                     phone: item.account.phonenumber, // Số điện thoại
//                     name: item.account.fullname, // Tên người nhận
//                     DC: item.city // Địa chỉ
//                 };
//             });
//         })
//         .catch(function (error) {
//             console.error('Error fetching address details:', error);
//         });

//     // Hàm tính tổng giá
//     $scope.calculateTotal = function () {
//         $scope.totalPrice = $scope.products.reduce(function (sum, product) {
//             return sum + (product.price * product.quantity); // Tính tổng giá
//         }, 0);
//         return $scope.totalPrice;
//     };

//     // Gọi hàm để lấy dữ liệu
//     $scope.getCombinedData = function () {
//         // Chưa có nội dung, có thể sử dụng để gọi API khác nếu cần
//     };
//      $scope.goToProduct = function (productId) {
//     if (productId) {
//       var url = "http://127.0.0.1:5500/src/main/resources/templates/assets/chitietsanpham.html?id=" + productId;
//       window.location.href = url;
//     } else {
//       console.log("Product ID is not valid.");
//     }
//   };
//     // Gọi hàm để tính tổng ngay khi khởi động
//     $scope.getCombinedData();
// }]);
// app.controller("CheckLogin", function ($scope, $http, $window, $timeout) {
//     // Khởi tạo thông tin người dùng và trạng thái đăng nhập
//     $scope.isLoggedIn = false;
//     $scope.user = {
//       idaccount: "",
//       password: "",
//     };
//     $scope.loginError = ""; // Biến để lưu thông báo lỗi
  
//     // Kiểm tra trạng thái đăng nhập từ localStorage
//     if (localStorage.getItem("loggedInUser")) {
//       $scope.isLoggedIn = true;
//       $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
//     } else {
//       // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
//       $window.location.href = "login.html"; // Đường dẫn đến trang đăng nhập
//     }
  
//     // Hàm cập nhật giao diện
//     $scope.updateAccountMenu = function () {
//       $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
//     };
  
//     // Phương thức đăng nhập
//     $scope.login = function () {
//       if (!$scope.isLoggedIn) {
//         $scope.loginError = ""; // Reset thông báo lỗi
  
//         // Gửi yêu cầu GET để lấy danh sách tài khoản từ API
//         $http
//           .get("http://localhost:8080/beesixcake/api/account")
//           .then(function (response) {
//             $scope.accounts = response.data;
//             var foundAccount = $scope.accounts.find(
//               (account) =>
//                 account.idaccount === $scope.user.idaccount &&
//                 account.password === $scope.user.password
//             );
  
//             if (foundAccount) {
//               if (foundAccount.admin) {
//                 // Nếu tài khoản là admin
//                 $scope.loginError = "Bạn không có quyền truy cập!";
//               } else {
//                 // Đăng nhập thành công
//                 $scope.loginSuccess = "Đăng nhập thành công!";
//                 // Lưu thông tin đăng nhập vào localStorage
//                 localStorage.setItem(
//                   "loggedInUser",
//                   JSON.stringify(foundAccount)
//                 );
  
//                 // Cập nhật giao diện
//                 $scope.updateAccountMenu();
  
//                 // Chuyển hướng về trang chính ngay lập tức
//                 $window.location.href = "index.html"; // Hoặc sử dụng $timeout nếu cần delay
//               }
//             } else {
//               // Nếu tài khoản không đúng hoặc mật khẩu không khớp
//               $scope.loginError = "Tên người dùng hoặc mật khẩu không đúng!";
//             }
//           })
//           .catch(function (error) {
//             // Xử lý lỗi từ API
//             $scope.loginError = "Lỗi khi kết nối đến máy chủ. Vui lòng thử lại.";
//             console.error("Error:", error);
//           });
//       } else {
//         alert("Bạn đã đăng nhập rồi.");
//       }
//     };
  
//     // Phương thức đăng xuất
//     $scope.logout = function () {
//       localStorage.removeItem("loggedInUser");
//       $scope.isLoggedIn = false;
//       $scope.loggedInUser = null;
//       $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
//     };
//   });
app.controller('CartController', ['$scope', '$http', function ($scope, $http) {
  $scope.products = [];
  $scope.addresses = [];
  $scope.account = {}; // Thông tin người mua hàng
  $scope.totalPrice = 0;

  // Lấy thông tin người mua hàng từ API
  $http.get('http://localhost:8080/beesixcake/api/account')
      .then(function (response) {
          $scope.account = response.data; // Dữ liệu trả về là đối tượng người mua
      })
      .catch(function (error) {
          console.error('Error fetching buyer info:', error);
      });

  // Lấy dữ liệu từ API sản phẩm
  $http.get('http://localhost:8080/beesixcake/api/orderdetail')
      .then(function (response) {
          $scope.products = response.data; // Xử lý dữ liệu sản phẩm
          $scope.calculateTotal(); // Tính tổng giá
      })
      .catch(function (error) {
          console.error('Error fetching product details:', error);
      });

  // Hàm tính tổng giá
  $scope.calculateTotal = function () {
      $scope.totalPrice = $scope.products.reduce(function (sum, product) {
          return sum + (product.price * product.quantity); // Tính tổng giá
      }, 0);
      return $scope.totalPrice;
  };
}]);
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