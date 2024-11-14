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

// Lấy dữ liệu trạng thái thanh toán từ API
$http.get(`${API}/statuspay`)
  .then(function(response) {
    $scope.paymentStatuses = response.data; // Cập nhật danh sách trạng thái thanh toán
  })
  .catch(function(error) {
    console.log("Có lỗi xảy ra khi lấy dữ liệu trạng thái thanh toán!", error);
  });

// Sau khi có được paymentStatuses từ API, bạn có thể sử dụng chúng trong giao diện
$scope.openOrderModal = function (order) {
  $scope.selectedOrder = angular.copy(order); // Đảm bảo giữ lại bản sao đơn hàng
  console.log("selectedOrder.idstatuspay", $scope.selectedOrder.idstatuspay); // Kiểm tra giá trị tại đây
  $scope.originalStatus = order.status.idstatus; // Lưu trạng thái ban đầu của đơn hàng
  if ($scope.selectedOrder.idstatuspay !== 1 && $scope.selectedOrder.idstatuspay !== 2) {
      $scope.selectedOrder.idstatuspay = 1; // Thiết lập giá trị mặc định là 1 nếu không hợp lệ
  }
  $scope.getOrderDetails(order.idorder);
};


// Cập nhật trạng thái thanh toán
$scope.updateOrderStatusPay = function () {
  // Gửi yêu cầu cập nhật trạng thái thanh toán đến API
  var updatedPayment = { idstatuspay: $scope.selectedOrder.idstatuspay };
  $http
    .put(`${API}/order/${$scope.selectedOrder.idorder}`, updatedPayment)
    .then((response) => {
      $scope.message = "Cập nhật trạng thái thanh toán thành công!";
      $scope.messageType = "success";
      $scope.loadOrders(); // Tải lại danh sách đơn hàng
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

  
  $scope.imageBaseUrl = "https://5ck6jg.csb.app/anh/"; 
  // Khởi tạo dữ liệu
  $scope.loadOrders();
});
