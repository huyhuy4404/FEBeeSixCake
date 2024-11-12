var app = angular.module("myApp", ["ngRoute"]);

const API = "http://localhost:8080/beesixcake/api";
const imageBaseUrl = "https://5ck6jg.csb.app/anh/"; // Đường dẫn cơ sở của ảnh

app.controller("OrderController", function ($scope, $http) {
  // Lấy danh sách đơn hàng
  $scope.refreshOrders = function () {
    $http({
      method: "GET",
      url: API + "/order",
    })
      .then(function (response) {
        $scope.Orders = response.data;
        // Cập nhật hình ảnh cho từng đơn hàng nếu có
        $scope.Orders.forEach((order) => {
          if (order.product && order.product.img) {
            order.product.img =
              imageBaseUrl + order.product.img.split("/").pop();
          }
        });
      })
      .catch(function (error) {
        console.error("Có lỗi xảy ra khi lấy danh sách đơn hàng: ", error);
      });
  };

  // Lấy chi tiết đơn hàng
  $scope.refreshOrderDetails = function () {
    $http({
      method: "GET",
      url: API + "/orderdetail",
    })
      .then(function (response) {
        $scope.OrderDetails = response.data;
        // Cập nhật hình ảnh cho chi tiết đơn hàng
        $scope.OrderDetails.forEach((detail) => {
          if (detail.product && detail.product.img) {
            detail.product.img =
              imageBaseUrl + detail.product.img.split("/").pop();
          }
        });
      })
      .catch(function (error) {
        console.error(
          "Có lỗi xảy ra khi lấy danh sách chi tiết đơn hàng: ",
          error
        );
      });
  };
  $scope.imageBaseUrl = "https://5ck6jg.csb.app/anh/";
  // Lấy giảm giá
  $scope.refreshDiscounts = function () {
    $http({
      method: "GET",
      url: API + "/discount",
    })
      .then(function (response) {
        $scope.Discounts = response.data;
      })
      .catch(function (error) {
        console.error("Có lỗi xảy ra khi lấy danh sách giảm giá: ", error);
      });
  };

  // Cập nhật trạng thái đơn hàng
  $scope.updateOrderStatus = function () {
    var newStatus = $scope.selectedOrder.status.idstatus;
    var oldStatus = $scope.originalStatus;

    var validationResult = isValidStatusChange(oldStatus, newStatus);
    if (!validationResult.isValid) {
      $scope.message =
        "Cập nhật trạng thái không thành công: " + validationResult.message;
      $scope.messageType = "error";
      return;
    }

    var updatedOrder = {
      idorder: $scope.selectedOrder.idorder,
      orderdate: $scope.selectedOrder.orderdate,
      totalamount: $scope.selectedOrder.totalamount,
      account: $scope.selectedOrder.account,
      status: {
        idstatus: newStatus,
      },
      address: $scope.selectedOrder.address,
      discount: $scope.selectedOrder.discount,
      payment: $scope.selectedOrder.payment,
    };

    $http
      .put(API + `/order/${updatedOrder.idorder}`, updatedOrder)
      .then(function (response) {
        $scope.message = "Cập nhật trạng thái thành công!";
        $scope.messageType = "success";
        $scope.refreshOrders(); // Refresh orders after status update
        $scope.refreshOrderStatusHistory(); // Call to update order status history
      })
      .catch(function (error) {
        $scope.message = "Có lỗi xảy ra khi cập nhật trạng thái!";
        $scope.messageType = "error";
      });
  };

  // Hàm kiểm tra điều kiện chuyển đổi trạng thái
  function isValidStatusChange(oldStatus, newStatus) {
    if (oldStatus == 1 && newStatus != 2 && newStatus != 4) {
      return {
        isValid: false,
        message:
          "Trạng thái Đang xác nhận chỉ có thể chuyển sang Đang giao hàng hoặc Đã hủy.",
      };
    }
    if (oldStatus == 2 && newStatus == 1) {
      return {
        isValid: false,
        message: "Trạng thái Đang giao hàng không thể quay lại Đang xác nhận.",
      };
    }
    if (oldStatus == 3 && (newStatus == 1 || newStatus == 2)) {
      return {
        isValid: false,
        message:
          "Trạng thái Đã hoàn thành không thể quay lại Đang xác nhận hoặc Đang giao hàng.",
      };
    }
    if (
      oldStatus == 4 &&
      (newStatus == 1 || newStatus == 2 || newStatus == 3)
    ) {
      return {
        isValid: false,
        message: "Trạng thái Đã hủy không thể chuyển về các trạng thái khác.",
      };
    }
    return { isValid: true };
  }

  // Định dạng hiển thị thời gian
  $scope.formatDate = function (dateString) {
    var date = new Date(dateString);
    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    var hours = ("0" + date.getHours()).slice(-2);
    var minutes = ("0" + date.getMinutes()).slice(-2);
    var seconds = ("0" + date.getSeconds()).slice(-2);
    return (
      day +
      "-" +
      month +
      "-" +
      year +
      " " +
      hours +
      ":" +
      minutes +
      ":" +
      seconds
    );
  };

  // Lấy trạng thái lịch sử đơn hàng
  $scope.refreshOrderStatusHistory = function () {
    $http({
      method: "GET",
      url: API + "/order-status-history",
    })
      .then(function (response) {
        const statusHistories = response.data;
        $scope.Orders.forEach((order) => {
          const orderHistory = statusHistories
            .filter((history) => history.order.idorder === order.idorder)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          if (orderHistory.length) {
            order.statusName = orderHistory[0].status.statusname;
            console.log(
              `Order ID: ${order.idorder}, Status Name: ${order.statusName}`
            );
          }
        });
      })
      .catch(function (error) {
        console.error(
          "Có lỗi xảy ra khi lấy trạng thái từ order-status-history: ",
          error
        );
      });
  };

  // Lấy chi tiết sản phẩm theo idorderdetail
  $scope.getOrderDetails = function (idorder) {
    $http({
      method: "GET",
      url: API + "/orderdetail/order/" + idorder, // API endpoint để lấy chi tiết đơn hàng dựa trên idorder
    })
      .then(function (response) {
        $scope.orderDetails = response.data; // Lưu dữ liệu chi tiết vào $scope
        console.log($scope.orderDetails); // Kiểm tra dữ liệu trả về trong console
      })
      .catch(function (error) {
        console.error("Có lỗi xảy ra khi lấy chi tiết đơn hàng: ", error);
      });
  };

  // Hàm khởi tạo khi chọn đơn hàng
  $scope.openOrderModal = function (order) {
    $scope.selectedOrder = order; // Lưu đơn hàng đang chọn
    $scope.getOrderDetails(order.idorder); // Gọi hàm lấy chi tiết đơn hàng
  };

  // Lấy danh sách đơn hàng (orders)
  $scope.refreshOrders = function () {
    $http({
      method: "GET",
      url: API + "/order",
    })
      .then(function (response) {
        $scope.Orders = response.data;
      })
      .catch(function (error) {
        console.error("Có lỗi xảy ra khi lấy danh sách đơn hàng: ", error);
      });
  };

  $scope.refreshOrders(); // Gọi hàm khi khởi tạo controller

  // Chọn đơn hàng để chỉnh sửa
  $scope.editOrder = function (order) {
    $scope.selectedOrder = angular.copy(order);
    $scope.originalStatus = angular.copy(order.status.idstatus);
    $scope.selectedOrder.addressdetail = `${order.address.housenumber}, ${order.address.roadname}, ${order.address.ward}, ${order.address.district}, ${order.address.city}`;

    // Lấy chi tiết của từng sản phẩm trong đơn hàng
    order.details.forEach(function (detail) {
      $scope.getOrderDetails(detail.idorderdetail); // Gọi hàm để lấy chi tiết sản phẩm theo idorderdetail
    });

    $scope.message = "Tải dữ liệu thành công!";
    $scope.messageType = "success";
  };

  // Gọi hàm khi controller khởi tạo
  $scope.refreshOrders();
  $scope.refreshOrderDetails();
  $scope.refreshOrderStatusHistory();
});
