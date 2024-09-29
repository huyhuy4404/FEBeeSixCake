var app = angular.module("myApp", ["ngRoute"]);

app.controller("OrderController", function ($scope, $http) {
  // Lấy danh sách đơn hàng
  $http({
    method: "GET",
    url: "http://localhost:8080/beesixcake/api/order",
  }).then(function (response) {
    $scope.Orders = response.data;
  });

  // Function to select order for editing
  $scope.editOrder = function (order) {
    $scope.selectedOrder = angular.copy(order);
    $scope.selectedOrder.fullAddress =
      order.address.housenumber +
      ", " +
      order.address.roadname +
      ", " +
      order.address.ward +
      ", " +
      order.address.district +
      ", " +
      order.address.city;
  };

  // Phương thức cập nhật trạng thái đơn hàng
  $scope.updateOrderStatus = function () {
    if ($scope.selectedOrder && $scope.selectedOrder.status) {
      var accountId = $scope.selectedOrder.account.idaccount;

      var updatedOrder = {
        idorder: $scope.selectedOrder.idorder,
        orderdate: $scope.selectedOrder.orderdate,
        totalamount: $scope.selectedOrder.totalamount,
        account: $scope.selectedOrder.account,
        status: {
          idstatus: $scope.selectedOrder.status.idstatus
        },
        address: $scope.selectedOrder.address,
        discount: $scope.selectedOrder.discount,
        payment: $scope.selectedOrder.payment
      };

      // Gửi yêu cầu PUT để cập nhật trạng thái
      $http({
        method: "PUT",
        url: `http://localhost:8080/beesixcake/api/order/${updatedOrder.idorder}`, // Cập nhật URL
        data: updatedOrder,
      })
      .then(function (response) {
        alert("Cập nhật trạng thái thành công!");
        // Tải lại danh sách đơn hàng sau khi cập nhật
        $scope.refreshOrders();
      })
      .catch(function (error) {
        alert("Có lỗi xảy ra khi cập nhật trạng thái!");
        console.error(error);
      });
    } else {
      alert("Vui lòng chọn đơn hàng và trạng thái hợp lệ.");
    }
  };

  // Phương thức xóa đơn hàng
  $scope.deleteOrder = function (orderId) {
    if (confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) {
      $http({
        method: "DELETE",
        url: `http://localhost:8080/beesixcake/api/order/${orderId}`,
      })
      .then(function (response) {
        alert("Xóa đơn hàng thành công!");
        // Tải lại danh sách đơn hàng sau khi xóa
        $scope.refreshOrders();
      })
      .catch(function (error) {
        alert("Có lỗi xảy ra khi xóa đơn hàng!");
        console.error(error);
      });
    }
  };

  // Hàm tải lại danh sách đơn hàng
  $scope.refreshOrders = function () {
    $http({
      method: "GET",
      url: "http://localhost:8080/beesixcake/api/order",
    }).then(function (response) {
      $scope.Orders = response.data;
    });
  };
});
