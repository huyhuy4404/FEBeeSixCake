var app = angular.module("myApp", ["ngRoute"]);

const API = "http://localhost:8080/beesixcake/api";
const imageBaseUrl = "https://5ck6jg.csb.app/anh/";

app.controller("OrderController", function ($scope, $window, $http) {
  // Tải danh sách đơn hàng và cập nhật trạng thái
  $scope.loadOrders = function () {
    $http
      .get(API + "/order")
      .then((response) => {
        $scope.Orders = response.data;
        $scope.Orders.forEach((order) => {
          if (order.product && order.product.img) {
            order.product.img =
              imageBaseUrl + order.product.img.split("/").pop();
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
            detail.product.img =
              imageBaseUrl + detail.product.img.split("/").pop();
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
      $scope.message =
        "Cập nhật trạng thái không thành công: " + validationResult.message;
      $scope.messageType = "error";
      $scope.isUpdating = false;
      return;
    }

    // Tạo đối tượng order-status-history mới
    var orderStatusHistory = {
      order: { idorder: $scope.selectedOrder.idorder },
      status: { idstatus: newStatus },
      timestamp: new Date().toISOString(),
    };

    // Gửi yêu cầu PUT để cập nhật trạng thái lên server
    $http
      .put(
        `${API}/order-status-history/${$scope.selectedOrder.idorder}`,
        orderStatusHistory
      )
      .then((response) => {
        $scope.message = "Cập nhật trạng thái thành công!";
        $scope.messageType = "success";

        // Cập nhật trạng thái trực tiếp trong $scope.selectedOrder
        $scope.selectedOrder.status.idstatus = newStatus;

        // Cập nhật trong danh sách Orders
        const orderIndex = $scope.Orders.findIndex(
          (order) => order.idorder === $scope.selectedOrder.idorder
        );
        if (orderIndex !== -1) {
          $scope.Orders[orderIndex].status.idstatus = newStatus;
          $scope.Orders[orderIndex].statusName = response.data.statusName;
        }
      })
      .catch((error) => {
        $scope.message = "Có lỗi xảy ra khi cập nhật trạng thái!";
        $scope.messageType = "error";
      })
      .finally(() => {
        $scope.isUpdating = false;
      });
  };

  $(document).on("hide.bs.modal", ".modal", function () {
    $window.location.reload(); // Reload toàn bộ trang
  });

  // Hàm kiểm tra điều kiện chuyển đổi trạng thái
  function isValidStatusChange(oldStatus, newStatus) {
    if (oldStatus === 1 && (newStatus === 2 || newStatus === 4)) {
      return { isValid: true };
    } else if (oldStatus === 2 && (newStatus === 3 || newStatus === 4)) {
      return { isValid: true };
    } else if (oldStatus === 3) {
      return {
        isValid: false,
        message:
          "Trạng thái 'Đã Giao Hàng' không thể cập nhật sang trạng thái khác.",
      };
    } else if (oldStatus === 4) {
      return {
        isValid: false,
        message: "Trạng thái 'Đã Hủy' không thể cập nhật sang trạng thái khác.",
      };
    } else {
      return { isValid: false, message: "Trạng thái không hợp lệ." };
    }
  }

  // Sau khi có được paymentStatuses từ API, bạn có thể sử dụng chúng trong giao diện
  $scope.openOrderModal = function (order) {
    $scope.selectedOrder = angular.copy(order); // Đảm bảo giữ lại bản sao đơn hàng
    console.log("selectedOrder.idstatuspay", $scope.selectedOrder.idstatuspay); // Kiểm tra giá trị tại đây
    $scope.originalStatus = order.status.idstatus; // Lưu trạng thái ban đầu của đơn hàng
    if (
      $scope.selectedOrder.idstatuspay !== 1 &&
      $scope.selectedOrder.idstatuspay !== 2
    ) {
      $scope.selectedOrder.idstatuspay = 1; // Thiết lập giá trị mặc định là 1 nếu không hợp lệ
    }
    $scope.getOrderDetails(order.idorder);
  };

  // Cập nhật trạng thái thanh toán
  $scope.updateOrderStatusPay = function () {
    var updatedPayment = {
      idstatuspay: $scope.selectedOrder.idstatuspay.idstatuspay,
    }; // Make sure no discount code or other unnecessary fields are being sent

    $http
      .put(`${API}/order/${$scope.selectedOrder.idorder}`, updatedPayment)
      .then((response) => {
        $scope.message = "Cập nhật trạng thái thanh toán thành công!";
        $scope.messageType = "success";
        $scope.loadOrders();
      })
      .catch((error) => {
        console.error(
          "Có lỗi xảy ra khi cập nhật trạng thái thanh toán: ",
          error
        );
        console.error("Chi tiết lỗi từ server: ", error.data); // In ra chi tiết lỗi từ server
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

  $scope.imageBaseUrl = "https://5ck6jg.csb.app/anh/"; // Đảm bảo base URL là đúng
  // Khởi tạo dữ liệu
  $scope.loadOrders();

  $scope.itemsPerPage = 5; // Limit to 5 orders per page

  $scope.updatePagination = function () {
      // Apply search filter
      if ($scope.searchQuery) {
        $scope.filteredOrders = $scope.Orders.filter(function (order) {
          return order.idorder.toString().includes($scope.searchQuery) || 
                 (order.statusName && order.statusName.toLowerCase().includes($scope.searchQuery.toLowerCase()));
        });
      } else {
        $scope.filteredOrders = $scope.Orders;
      }
  
      // Calculate total pages
      $scope.totalPages =
        Math.ceil($scope.filteredOrders.length / $scope.itemsPerPage) || 1;
  
      // Create an array of pages
      $scope.pages = [];
      for (var i = 1; i <= $scope.totalPages; i++) {
        $scope.pages.push(i);
      }
  
      // Adjust current page if it exceeds total pages
      if ($scope.currentPage > $scope.totalPages) {
        $scope.currentPage = $scope.totalPages;
      }
  
      // Get the orders for the current page
      var start = ($scope.currentPage - 1) * $scope.itemsPerPage;
      var end = start + $scope.itemsPerPage;
      $scope.paginatedOrders = $scope.filteredOrders.slice(start, end);
    };
  
    // Page change function
    $scope.goToPage = function (page) {
      if (page < 1 || page > $scope.totalPages) {
        return;
      }
      $scope.currentPage = page;
      $scope.updatePagination();
    };
  
    // Watch for changes in Orders or searchQuery to update pagination
    $scope.$watchGroup(
      ["Orders", "searchQuery"],
      function (newValues, oldValues) {
        $scope.currentPage = 1; // Reset to page 1 when data changes
        $scope.updatePagination();
      }
    );
  

});
