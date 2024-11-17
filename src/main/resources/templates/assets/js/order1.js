
// app.controller('OrderController', ['$scope', '$http', function ($scope, $http) {
//   $scope.products = []; // Danh sách sản phẩm từ đơn hàng
//   $scope.loading = true; // Trạng thái tải
//   $scope.noOrdersMessage = ''; // Thông báo không tìm thấy đơn hàng
//   $scope.pendingOrders = [];
//   $scope.deliveredOrders = [];
//   $scope.completedOrders = [];
//   $scope.cancelledOrders = [];

//   // Lấy thông tin người dùng đã đăng nhập
//   const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

//   // Kiểm tra xem người dùng đã đăng nhập hay chưa
//   if (loggedInUser) {
//       loadOrders(); // Tải đơn hàng
//   } else {
//       $scope.noOrdersMessage = 'Vui lòng đăng nhập để xem đơn hàng.';
//       $scope.loading = false;
//   }

//   // Hàm tải đơn hàng
//   function loadOrders() {
//       $scope.loading = true;

//       $http.get(`http://localhost:8080/beesixcake/api/order/account/${loggedInUser.idaccount}`)
//           .then(function (response) {
//               if (response.data && response.data.length > 0) {
//                   let allProducts = [];
//                   let promises = response.data.map(order => {
//                       return $http.get(`http://localhost:8080/beesixcake/api/orderdetail?orderId=${order.idorder}`)
//                           .then(function (detailResponse) {
//                               detailResponse.data.forEach(detail => {
//                                   if (detail.order.account.idaccount === loggedInUser.idaccount) {
//                                       // Kiểm tra sản phẩm đã tồn tại trong allProducts chưa
//                                       if (!allProducts.some(prod => prod.productdetail.product.id === detail.productdetail.product.id && prod.order.idorder === detail.order.idorder)) {
//                                           allProducts.push(detail);
//                                       }
//                                   }
//                               });
//                           });
//                   });

//                   return Promise.all(promises).then(() => {
//                       $scope.products = allProducts; // Cập nhật danh sách sản phẩm
//                       return $http.get(`http://localhost:8080/beesixcake/api/order-status-history`);
//                   }).then(function (statusResponse) {
//                       // Gắn trạng thái vào các sản phẩm
//                       $scope.products.forEach(product => {
//                           const statusInfo = statusResponse.data.find(status => status.order.idorder === product.order.idorder);
//                           if (statusInfo) {
//                               product.status = statusInfo.status.statusname; // Thêm trạng thái vào sản phẩm
//                           }
//                       });
//                       // Phân loại đơn hàng theo trạng thái
//                       classifyOrders();
//                   });
//               } else {
//                   $scope.noOrdersMessage = 'Không tìm thấy đơn hàng của người đăng nhập này.';
//               }
//           })
//           .catch(function (error) {
//               console.error('Lỗi khi lấy thông tin đơn hàng:', error);
//               $scope.noOrdersMessage = 'Đã xảy ra lỗi khi lấy thông tin đơn hàng.';
//           })
//           .finally(function () {
//               $scope.loading = false; // Đặt trạng thái tải về false
//           });
//   }

//   // Hàm phân loại đơn hàng theo trạng thái
//   function classifyOrders() {
//       // Reset các mảng trước khi phân loại
//       $scope.pendingOrders = [];
//       $scope.deliveredOrders = [];
//       $scope.completedOrders = [];
//       $scope.cancelledOrders = [];

//       $scope.products.forEach(order => {
//           switch (order.status) {
//               case 'Đang Xác Nhận':
//                   $scope.pendingOrders.push(order);
//                   break;
//               case 'Đang Giao Hàng':
//                   $scope.deliveredOrders.push(order);
//                   break;
//               case 'Hoàn Thành':
//                   $scope.completedOrders.push(order);
//                   break;
//               case 'Hủy':
//                   $scope.cancelledOrders.push(order);
//                   break;
//           }
//       });
//   }

//   // Hàm tính tổng giá
//   $scope.calculateTotal = function () {
//       return $scope.products.reduce(function (sum, product) {
//           return sum + (product.productdetail.unitprice * product.quantity);
//       }, 0);
//   };

//   // Hàm định dạng tiền tệ
//   $scope.formatCurrency = function (amount) {
//       return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
//   };

//   // Hàm hủy đơn hàng
//   $scope.cancelOrder = function (order) {
//       const payload = {
//           idstatushistory: order.idstatushistory,
//           orderId: order.order.idorder,
//           newStatusId: 4 // ID cho trạng thái "Hủy"
//       };

//       $http.put(`http://localhost:8080/beesixcake/api/order/s`, payload)
//           .then(function (response) {
//               console.log('Đơn hàng đã được hủy thành công:', response.data);
//               order.status = 'Hủy'; // Cập nhật trạng thái trên UI
//               classifyOrders(); // Cập nhật phân loại
//           })
//           .catch(function (error) {
//               console.error('Lỗi khi hủy đơn hàng:', error);
//               alert('Không thể hủy đơn hàng. Vui lòng thử lại.');
//           });
//   };

//   // Hàm chuyển hướng đến trang chi tiết sản phẩm
//   $scope.goToProduct = function (productId, order) {
//     if (productId) {
//         console.log(order); // Kiểm tra chi tiết đơn hàng
//         const orderDetails = {
//             idOrder: order.order.idorder,
//             productId: productId,
//             productName: order.productdetail.product.productname,
//             size: order.productdetail.size.sizename, // Lưu kích cỡ
//             quantity: order.quantity,
//             unitPrice: order.productdetail.unitprice,
//             orderDate: order.order.orderdate,
//             address: order.order.addressdetail,
//             status: order.status
//         };

//         localStorage.setItem("orderDetails", JSON.stringify(orderDetails));
//         const url = `http://127.0.0.1:5500/src/main/resources/templates/assets/chitietsanpham.html?id=${productId}`;
//         window.location.href = url;
//     } else {
//         console.log("Product ID is not valid.");
//     }
// };
// }]);
app.controller('OrderController', ['$scope', '$http', function ($scope, $http) {
  $scope.products = [];
  $scope.loading = true;
  $scope.noOrdersMessage = '';
  $scope.pendingOrders = [];
  $scope.deliveredOrders = [];
  $scope.completedOrders = [];
  $scope.cancelledOrders = [];
  $scope.selectedOrder = {};
  $scope.selectedOrderDetails = [];

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  if (loggedInUser) {
      loadOrders();
  } else {
      $scope.noOrdersMessage = 'Vui lòng đăng nhập để xem đơn hàng.';
      $scope.loading = false;
  }

  function loadOrders() {
      $scope.loading = true;
      $http.get(`http://localhost:8080/beesixcake/api/order/account/${loggedInUser.idaccount}`)
          .then(function (response) {
              if (response.data && response.data.length > 0) {
                  let allProducts = [];
                  let promises = response.data.map(order => {
                      return $http.get(`http://localhost:8080/beesixcake/api/orderdetail?orderId=${order.idorder}`)
                          .then(function (detailResponse) {
                              detailResponse.data.forEach(detail => {
                                  if (detail.order.account.idaccount === loggedInUser.idaccount) {
                                      if (!allProducts.some(prod => prod.productdetail.product.id === detail.productdetail.product.id && prod.order.idorder === detail.order.idorder)) {
                                          allProducts.push(detail);
                                      }
                                  }
                              });
                          });
                  });

                  return Promise.all(promises).then(() => {
                      $scope.products = allProducts;
                      return $http.get(`http://localhost:8080/beesixcake/api/order-status-history`);
                  }).then(function (statusResponse) {
                      $scope.products.forEach(product => {
                          const statusInfo = statusResponse.data.find(status => status.order.idorder === product.order.idorder);
                          if (statusInfo) {
                              product.status = statusInfo.status.statusname;
                          }
                      });
                      classifyOrders();
                  });
              } else {
                  $scope.noOrdersMessage = 'Không tìm thấy đơn hàng của người đăng nhập này.';
              }
          })
          .catch(function (error) {
              console.error('Lỗi khi lấy thông tin đơn hàng:', error);
              $scope.noOrdersMessage = 'Đã xảy ra lỗi khi lấy thông tin đơn hàng.';
          })
          .finally(function () {
              $scope.loading = false;
          });
  }

  function classifyOrders() {
      $scope.pendingOrders = [];
      $scope.deliveredOrders = [];
      $scope.completedOrders = [];
      $scope.cancelledOrders = [];

      $scope.products.forEach(order => {
          switch (order.status) {
              case 'Đang Xác Nhận':
                  $scope.pendingOrders.push(order);
                  break;
              case 'Đang Giao Hàng':
                  $scope.deliveredOrders.push(order);
                  break;
              case 'Hoàn Thành':
                  $scope.completedOrders.push(order);
                  break;
              case 'Hủy':
                  $scope.cancelledOrders.push(order);
                  break;
          }
      });
  }

  $scope.calculateTotal = function () {
      return $scope.products.reduce(function (sum, product) {
          return sum + (product.productdetail.unitprice * product.quantity);
      }, 0);
  };

  $scope.formatCurrency = function (amount) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  $scope.cancelOrder = function (order) {
      const payload = {
          idstatushistory: order.idstatushistory,
          orderId: order.order.idorder,
          newStatusId: 4 // ID cho trạng thái "Hủy"
      };

      $http.put(`http://localhost:8080/beesixcake/api/order/s`, payload)
          .then(function (response) {
              console.log('Đơn hàng đã được hủy thành công:', response.data);
              order.status = 'Hủy';
              classifyOrders();
          })
          .catch(function (error) {
              console.error('Lỗi khi hủy đơn hàng:', error);
              alert('Không thể hủy đơn hàng. Vui lòng thử lại.');
          });
  };

  // Hàm tải chi tiết đơn hàng
  $scope.loadOrderDetails = function (order) {
    console.log("Đơn hàng được chọn:", order);

    // Giả sử order.order.idorder là ID đơn hàng cần lấy chi tiết
    $http.get(`http://localhost:8080/beesixcake/api/orderdetail/${order.idorderdetail}`)
        .then(function (response) {
            console.log("Chi tiết đơn hàng:", response.data); // Kiểm tra dữ liệu

            // Cập nhật selectedOrder với dữ liệu nhận được từ API
            $scope.selectedOrder = response.data;

            // Hiển thị modal sau khi cập nhật dữ liệu
            $('#orderDetailsModal').modal('show');
        })
        .catch(function (error) {
            console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
            alert('Không thể tải chi tiết đơn hàng. Vui lòng thử lại.');
        });
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