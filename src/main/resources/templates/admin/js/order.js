var app = angular.module("myApp", ["ngRoute"]);

const API = "http://localhost:8080/beesixcake/api";
const imageBaseUrl = "https://5ck6jg.csb.app/anh/";

app.controller("OrderController", function ($scope, $http) {
  // Tải danh sách đơn hàng và cập nhật trạng thái
  $scope.loadOrders = function () {
    $http
      .get(API + "/order")
      .then((response) => {
        $scope.Orders = response.data;
        $scope.Orders.forEach((order) => {
          if (order.product && order.product.img) {
            order.product.img = imageBaseUrl + order.product.img.split("/").pop();
          }
        });
        $scope.refreshOrderStatusHistory(); // Cập nhật lịch sử trạng thái cho mỗi đơn hàng
      })
      .catch((error) => {
        console.error("Có lỗi xảy ra khi lấy danh sách đơn hàng: ", error);
      });
  };

  // Lấy chi tiết đơn hàng cho một đơn hàng cụ thể
  $scope.getOrderDetails = function (idorder) {
    $http
      .get(`${API}/orderdetail/order/${idorder}`)
      .then((response) => {
        $scope.orderDetails = response.data;
        $scope.orderDetails.forEach((detail) => {
          if (detail.product && detail.product.img) {
            detail.product.img = imageBaseUrl + detail.product.img.split("/").pop();
          }
        });
      })
      .catch((error) => {
        console.error("Có lỗi xảy ra khi lấy chi tiết đơn hàng: ", error);
      });
  };

  // Lấy lịch sử trạng thái đơn hàng và cập nhật trạng thái hiện tại
  $scope.refreshOrderStatusHistory = function () {
    $http
      .get(API + "/order-status-history")
      .then((response) => {
        const statusHistories = response.data;
        $scope.Orders.forEach((order) => {
          const orderHistory = statusHistories
            .filter((history) => history.order.idorder === order.idorder)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          if (orderHistory.length) {
            order.statusName = orderHistory[0].status.statusname;
            order.status = orderHistory[0].status; // Cập nhật trạng thái trực tiếp vào order
          }
        });
        $scope.$applyAsync(); // Đảm bảo AngularJS nhận diện sự thay đổi
      })
      .catch((error) => {
        console.error(
          "Có lỗi xảy ra khi lấy trạng thái từ order-status-history: ",
          error
        );
      });
  };

  // Cập nhật trạng thái đơn hàng với điều kiện kiểm tra chuyển đổi hợp lệ
  $scope.updateOrderStatus = function () {
    $scope.isUpdating = true; // Bật trạng thái đang cập nhật
  
    var newStatus = $scope.selectedOrder.status.idstatus;
    var oldStatus = $scope.originalStatus;
  
    // Ép kiểu về số nguyên để đảm bảo so sánh đúng
    oldStatus = Number(oldStatus);
    newStatus = Number(newStatus);
  
    // Kiểm tra nếu trạng thái không thay đổi
    if (oldStatus === newStatus) {
      $scope.message = "Trạng thái không thay đổi.";
      $scope.messageType = "info";
      $scope.isUpdating = false;
      return;
    }
  
    // Kiểm tra điều kiện chuyển đổi trạng thái hợp lệ
    var validationResult = isValidStatusChange(oldStatus, newStatus);
  
    if (!validationResult.isValid) {
      $scope.message = "Cập nhật trạng thái không thành công: " + validationResult.message;
      $scope.messageType = "error";
      $scope.isUpdating = false;
      return;
    }
  
    // Tạo đối tượng order-status-history mới
    var orderStatusHistory = {
      order: { idorder: $scope.selectedOrder.idorder },
      status: { idstatus: newStatus },
      timestamp: new Date().toISOString()
    };
  
    // Gửi yêu cầu PUT để cập nhật trạng thái lên server
    $http.put(`${API}/order-status-history/${$scope.selectedOrder.idorder}`, orderStatusHistory)
      .then((response) => {
        $scope.message = "Cập nhật trạng thái thành công!";
        $scope.messageType = "success";
        $scope.loadOrders();  // Tải lại danh sách đơn hàng sau khi cập nhật
      })
      .catch((error) => {
        $scope.message = "Có lỗi xảy ra khi cập nhật trạng thái!";
        $scope.messageType = "error";
      })
      .finally(() => {
        $scope.isUpdating = false;
      });
  };
  
  // Hàm kiểm tra điều kiện chuyển đổi trạng thái
  function isValidStatusChange(oldStatus, newStatus) {
    if (oldStatus === 1 && (newStatus === 2 || newStatus === 4)) {
      return { isValid: true };
    } else if (oldStatus === 2 && (newStatus === 3 || newStatus === 4)) {
      return { isValid: true };
    } else if (oldStatus === 3 && newStatus === 4) {
      return { isValid: true };
    } else if (oldStatus === 4) {
      return { isValid: false, message: "Trạng thái 'Đã Hủy' không thể cập nhật sang trạng thái khác." };
    } else {
      return { isValid: false, message: "Trạng thái không hợp lệ." };
    }
  }

  // Cập nhật trạng thái thanh toán cho đơn hàng
  $scope.updateOrderStatusPay = function () {
    $scope.isUpdating = true; // Bật trạng thái đang cập nhật

    // Kiểm tra trạng thái thanh toán mới
    var newStatusPay = $scope.selectedOrder.statuspay.idstatuspay;

    // Tạo đối tượng cập nhật trạng thái thanh toán
    var updatedPayment = {
      statuspay: { idstatuspay: newStatusPay },
      timestamp: new Date().toISOString()
    };

    // Gửi yêu cầu PUT để cập nhật trạng thái thanh toán
    $http
      .put(`${API}/order/${$scope.selectedOrder.idorder}/payment`, updatedPayment)
      .then((response) => {
        $scope.message = "Cập nhật trạng thái thanh toán thành công!";
        $scope.messageType = "success";

        // Tải lại danh sách đơn hàng sau khi cập nhật
        $scope.loadOrders();
      })
      .catch((error) => {
        $scope.message = "Có lỗi xảy ra khi cập nhật thanh toán!";
        $scope.messageType = "error";
      })
      .finally(() => {
        $scope.isUpdating = false;
      });
  };

  // Định dạng thời gian hiển thị
  $scope.formatDate = function (dateString) {
    var date = new Date(dateString);
    return date.toLocaleString("vi-VN", { hour12: false });
  };

  // Mở modal với thông tin đơn hàng và chi tiết sản phẩm
  $scope.openOrderModal = function (order) {
    $scope.selectedOrder = angular.copy(order); // Đảm bảo giữ lại bản sao đơn hàng để tránh sửa trực tiếp
    $scope.originalStatus = order.status.idstatus; // Lưu trạng thái ban đầu của đơn hàng
    $scope.getOrderDetails(order.idorder);

    // Đặt `paymentButtonActive` là false mỗi khi mở modal
    $scope.paymentButtonActive = false;
  };

  $scope.imageBaseUrl = "https://5ck6jg.csb.app/anh/"; 
  // Khởi tạo dữ liệu
  $scope.loadOrders();
});
