var app = angular.module("myApp", ["ngRoute"]);

const API = "http://localhost:8080/beesixcake/api";

app.controller("OrderController", function ($scope, $http) {
  // Lấy danh sách đơn hàng
  $scope.refreshOrders = function () {
    $http({
      method: "GET",
      url: API + "/order",
    }).then(function (response) {
      $scope.Orders = response.data;
    }).catch(function (error) {
      console.error("Có lỗi xảy ra khi lấy danh sách đơn hàng: ", error);
    });
  };

  $scope.refreshOrders();

  // Chọn đơn hàng để chỉnh sửa
  $scope.editOrder = function (order) {
    $scope.selectedOrder = angular.copy(order);
    $scope.originalStatus = angular.copy(order.status.idstatus);
    $scope.selectedOrder.fullAddress = `${order.address.housenumber}, ${order.address.roadname}, ${order.address.ward}, ${order.address.district}, ${order.address.city}`;

    // Gọi hàm để lấy chi tiết đơn hàng
    $scope.getOrderDetails(order.idorder);

    $scope.message = "Tải dữ liệu thành công!";
    $scope.messageType = "success";

    var editTab = new bootstrap.Tab(document.getElementById("edit-tab"));
    editTab.show();
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
    return { isValid: true }; // Các điều kiện hợp lệ
  }

  // Cập nhật trạng thái đơn hàng
  $scope.updateOrderStatus = function () {
    var newStatus = $scope.selectedOrder.status.idstatus;
    var oldStatus = $scope.originalStatus;

    // Kiểm tra điều kiện trước khi cập nhật
    var validationResult = isValidStatusChange(oldStatus, newStatus);
    if (!validationResult.isValid) {
      $scope.message =
        "Cập nhật trạng thái không thành công: " + validationResult.message;
      $scope.messageType = "error";
      return;
    }

    // Nếu điều kiện hợp lệ, thực hiện cập nhật
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
        $scope.refreshOrders();
      })
      .catch(function (error) {
        $scope.message = "Có lỗi xảy ra khi cập nhật trạng thái!";
        $scope.messageType = "error";
      });
  };

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

  // Gọi chi tiết đơn hàng khi người dùng nhấp vào nút "Chi Tiết"
  $scope.showOrderDetails = function (order) {
    // Gọi API để lấy chi tiết đơn hàng và các sản phẩm
    $scope.getOrderDetails(order.idorder);

    // Hiển thị modal sau khi lấy xong dữ liệu
    var modal = new bootstrap.Modal(
      document.getElementById("modal-" + order.idorder)
    );
    modal.show();
  };

  // Hàm lấy chi tiết đơn hàng và kiểm tra xem chi tiết sản phẩm có được trả về không
  $scope.getOrderDetails = function (orderId) {
    $http({
      method: "GET",
      url: API + "/order/" + orderId + "/details",
    })
      .then(function (response) {
        const order = $scope.Orders.find((o) => o.idorder === orderId);
        if (order) {
          // Gán chi tiết đơn hàng vào order (bao gồm các sản phẩm)
          order.details = response.data;

          // Kiểm tra xem API có trả về thông tin sản phẩm không
          order.details.forEach((detail) => {
            if (!detail.product) {
              // Nếu không có thông tin sản phẩm, thực hiện gọi API để lấy chi tiết sản phẩm dựa trên productId
              $http({
                method: "GET",
                url: API + `/product/${detail.productId}`,
              })
                .then(function (productResponse) {
                  // Gán thông tin chi tiết sản phẩm vào detail
                  detail.product = productResponse.data;
                })
                .catch(function (error) {
                  console.error(
                    "Có lỗi xảy ra khi lấy thông tin sản phẩm: ",
                    error
                  );
                });
            }
          });
        }
      })
      .catch(function (error) {
        console.error("Có lỗi xảy ra khi lấy chi tiết đơn hàng: ", error);
      });
  };
});
