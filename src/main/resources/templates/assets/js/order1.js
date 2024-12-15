var app = angular.module("myApp", ["ngRoute"]);
const API = "http://localhost:8080/beesixcake/api";
app.controller("OrderController", [
  "$scope",
  "$http",
  function ($scope, $http) {
    $scope.statuses = []; // Danh sách trạng thái
    $scope.ordersByStatus = {}; // Phân loại đơn hàng theo trạng thái
    $scope.selectedOrders = []; // Đơn hàng hiển thị
    $scope.loading = true;
    $scope.activeTab = 0; // Tab đầu tiên mặc định active
    $scope.editOrder = {}; // Đơn hàng đang được sửa

    // Đặt tab đang được chọn
    $scope.setActiveTab = function (index) {
      $scope.activeTab = index;
    };

    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!loggedInUser) {
      console.error("Người dùng chưa đăng nhập.");
      return;
    }

    console.log("Thông tin đăng nhập (loggedInUser):", loggedInUser);

    function initialize() {
      $scope.loading = true;

      // Biến để lưu ID trạng thái "Đã Hủy"
      $scope.canceledStatusId = null;

      // Bước 1: Gọi API lấy danh sách trạng thái
      $http
        .get("http://localhost:8080/beesixcake/api/status")
        .then((statusResponse) => {
          console.log("Danh sách trạng thái:", statusResponse.data);
          $scope.statuses = statusResponse.data;

          // Tìm ID trạng thái "Đã Hủy"
          const canceledStatus = $scope.statuses.find(
            (status) => status.statusname === "Đã Hủy"
          );
          if (canceledStatus) {
            $scope.canceledStatusId = canceledStatus.idstatus; // Lưu ID trạng thái "Đã Hủy"
            console.log(`ID trạng thái "Đã Hủy": ${$scope.canceledStatusId}`);
          } else {
            console.error(
              "Không tìm thấy trạng thái 'Đã Hủy' trong danh sách."
            );
          }

          // Chuẩn bị cấu trúc phân loại (theo idstatus)
          $scope.statuses.forEach((status) => {
            $scope.ordersByStatus[status.idstatus] = [];
          });

          // Bước 2: Gọi API lấy danh sách đơn hàng theo tài khoản
          return $http.get(
            `http://localhost:8080/beesixcake/api/order/account/${loggedInUser.idaccount}`
          );
        })
        .then((orderResponse) => {
          console.log("Danh sách đơn hàng:", orderResponse.data);
          const orders = orderResponse.data;

          // Chuyển đổi múi giờ UTC+7 cho `orderdate`
          orders.forEach((order) => {
            if (order.orderdate) {
              const utcDate = new Date(order.orderdate);
              order.orderdate = new Date(utcDate.getTime() + 7 * 3600000);
            }
          });

          // Gọi API lấy trạng thái chi tiết từng đơn hàng
          const promises = orders.map((order) =>
            $http
              .get(
                `http://localhost:8080/beesixcake/api/order-status-history/by-order/${order.idorder}`
              )
              .then((statusResponse) => {
                const statusData = statusResponse.data[0];
                order.statusname =
                  statusData?.status.statusname.trim() || "Không Xác Định";
                order.statusid = statusData?.status.idstatus || null;
              })
              .catch((error) => {
                console.error(
                  `Lỗi khi lấy trạng thái đơn hàng ${order.idorder}:`,
                  error
                );
                order.statusname = "Không Xác Định";
                order.statusid = null;
              })
          );

          return Promise.all(promises).then(() => {
            // Phân loại đơn hàng theo trạng thái
            orders.forEach((order) => {
              if (order.statusid && $scope.ordersByStatus[order.statusid]) {
                $scope.ordersByStatus[order.statusid].push(order);
              }
            });

            // Sắp xếp từng nhóm trạng thái theo thời gian (mới nhất đến cũ nhất)
            Object.keys($scope.ordersByStatus).forEach((statusId) => {
              $scope.ordersByStatus[statusId].sort((a, b) => {
                return new Date(b.orderdate) - new Date(a.orderdate);
              });
            });

            // Gán mặc định đơn hàng của trạng thái đầu tiên vào bảng
            const firstStatusId =
              $scope.statuses.length > 0 ? $scope.statuses[0].idstatus : null;
            if (firstStatusId) {
              $scope.selectedOrders = $scope.ordersByStatus[firstStatusId];
            }

            console.log(
              "Orders By Status After Classification:",
              $scope.ordersByStatus
            );
          });
        })
        .catch((error) => {
          console.error("Lỗi khi tải dữ liệu:", error);
        })
        .finally(() => {
          $scope.loading = false;
          console.log("Orders By Status (Final):", $scope.ordersByStatus);
        });
    }

    initialize();

    // Lọc đơn hàng theo trạng thái
    $scope.filterOrdersByStatus = function (statusId) {
      $scope.selectedOrders = $scope.ordersByStatus[statusId] || [];
      console.log(
        `Đơn hàng thuộc trạng thái ID "${statusId}":`,
        $scope.selectedOrders
      );
    };

    // Lấy chi tiết đơn hàng
  $scope.getOrderDetails = function (idorder) {
    $http
      .get(`${API}/orderdetail/order/${idorder}`)
      .then((response) => {
        $scope.orderDetails = response.data;
        $scope.orderDetails.forEach((detail) => {
          if (detail.product && detail.product.img) {
            detail.product.img =
              $scope.imageBaseUrl + detail.product.img.split("/").pop();
          }
        });
      })
      .catch((error) => {
        console.error("Có lỗi xảy ra khi lấy chi tiết đơn hàng: ", error);
        $scope.showMessageModal("Không thể tải chi tiết đơn hàng!", "error");
      });
  };

    $scope.openOrderModal = function (order) {
      $scope.selectedOrder = angular.copy(order);
      $scope.getOrderDetails(order.idorder);
      $scope.showReviewButton =
        order.statusid === 3 && order.statuspay.idstatuspay === 2;
      console.log("Thông tin đơn hàng ID:", $scope.selectedOrder);
      const modalElement = document.getElementById("orderDetailModal");
      console.log("Modal Element:", modalElement);
      const modal = new bootstrap.Modal(modalElement, { keyboard: true });
      modal.show();
      console.log($scope.selectedOrder.account.idaccount);
    };
    $scope.openReviewForm = function (productId, orderDetailId) {
      console.log("Đánh giá sản phẩm ID: ", productId);
      console.log("ID Chi Tiết Đơn Hàng: ", orderDetailId);
      window.location.href = `danhgia.html?idproduct=${productId}&idorderdetail=${orderDetailId}`;
    };
    // Chức năng sửa đơn hàng
    $scope.editOrderDetails = function (order) {
      $scope.editOrder = angular.copy(order); // Sao chép thông tin đơn hàng để sửa
      const editModalElement = document.getElementById("editOrderModal");
      const editModal = new bootstrap.Modal(editModalElement, {
        keyboard: true,
      });
      editModal.show();
    };
    $scope.calculateTotalProductPrice = function () {
      let totalProductPrice = 0;
      angular.forEach($scope.orderDetails, function (detail) {
        totalProductPrice += detail.quantity * detail.productdetail.unitprice;
      });
      return totalProductPrice;
    };

    $scope.calculateDiscount = function () {
      // Kiểm tra xem có giảm giá không và có phần trăm giảm giá hay không
      if (
        $scope.selectedOrder.discount &&
        $scope.selectedOrder.discount.discountpercentage
      ) {
        const totalProductPrice = $scope.calculateTotalProductPrice(); // Tổng tiền sản phẩm
        const discountPercentage =
          $scope.selectedOrder.discount.discountpercentage; // Phần trăm giảm giá
        const discountAmount = (totalProductPrice * discountPercentage) / 100; // Tính phần trăm giảm
        // Nếu không thì áp dụng giảm theo phần trăm
        return discountAmount;
      }

      return 0; // Nếu không có giảm giá thì trả về 0
    };

    $scope.calculateTotalOrder = function () {
      const totalProductPrice = $scope.calculateTotalProductPrice();
      const discountAmount = $scope.calculateDiscount();
      const totalOrder =
        totalProductPrice - discountAmount + $scope.selectedOrder.shipfee;
      $scope.selectedOrder.total = totalOrder; // Cập nhật tổng tiền đơn hàng
    };

    // Gửi yêu cầu sửa đơn hàng
    $scope.updateOrder = function () {
      $http
        .put(
          `http://localhost:8080/beesixcake/api/order/update/${$scope.editOrder.idorder}`,
          $scope.editOrder
        )
        .then((response) => {
          console.log("Đơn hàng đã được cập nhật:", response.data);

          // Cập nhật danh sách đơn hàng hiển thị
          const index = $scope.selectedOrders.findIndex(
            (order) => order.idorder === $scope.editOrder.idorder
          );
          if (index !== -1) {
            $scope.selectedOrders[index] = angular.copy($scope.editOrder);
          }

          // Đóng modal
          const editModalElement = document.getElementById("editOrderModal");
          const editModal = bootstrap.Modal.getInstance(editModalElement);
          editModal.hide();
        })
        .catch((error) => {
          console.error("Lỗi khi cập nhật đơn hàng:", error);
        });
    };

    $scope.cancelOrder = function (order) {
      // Lấy trạng thái mới nhất của đơn hàng từ API trước khi thực hiện hủy
      $http
        .get(`${API}/order-status-history/${order.idorder}`)
        .then((response) => {
          const latestStatus = response.data.status;
    
          // Kiểm tra nếu trạng thái đơn hàng không còn là "Chờ Xác Nhận" (ID 1)
          if (latestStatus.idstatus !== 1) {
            alert(
              `Đơn hàng ID: ${order.idorder} hiện đã chuyển sang trạng thái "${latestStatus.statusname}". Bạn không thể hủy đơn hàng này nữa!`
            );
            // Reload lại trang để cập nhật trạng thái mới
            location.reload();
            return;
          }
    
          // Nếu trạng thái là "Chờ Xác Nhận", hiển thị xác nhận hủy
          const confirmation = confirm(
            `Bạn có chắc chắn muốn hủy đơn hàng ID: ${order.idorder} không?`
          );
    
          if (!confirmation) {
            return; // Thoát nếu người dùng chọn "Hủy"
          }
    
          console.log(`Hủy đơn hàng: ${order.idorder}`);
    
          // Cập nhật trạng thái đơn hàng sang "Đã Hủy" (idstatus = 4)
          const orderStatusHistory = {
            order: { idorder: order.idorder },
            status: { idstatus: 4 }, // Trạng thái "Đã Hủy"
            timestamp: new Date().toISOString(),
          };
    
          $http
            .put(`${API}/order-status-history/${order.idorder}`, orderStatusHistory)
            .then(() => {
              // Hiển thị thông báo thành công
              alert("Hủy đơn hàng thành công!");
    
              // Khôi phục tồn kho (cộng lại số lượng sản phẩm đã mua vào kho)
              $scope.restoreInventory(order.idorder);
    
              // Reload lại trang web
              location.reload();
            })
            .catch((error) => {
              console.error("Có lỗi xảy ra khi hủy đơn hàng:", error);
    
              // Hiển thị thông báo lỗi
              $scope.showMessageModal(
                "Không thể hủy đơn hàng. Vui lòng thử lại sau!",
                "error"
              );
            });
        })
        .catch((error) => {
          console.error("Có lỗi xảy ra khi kiểm tra trạng thái đơn hàng:", error);
    
          // Hiển thị thông báo lỗi
          $scope.showMessageModal(
            "Không thể kiểm tra trạng thái đơn hàng. Vui lòng thử lại sau!",
            "error"
          );
        });
    };
    $scope.restoreInventory = function (idorder) {
      $http
        .get(`${API}/orderdetail/order/${idorder}`)
        .then((response) => {
          const orderDetails = response.data;
    
          // Kiểm tra nếu dữ liệu chi tiết đơn hàng hợp lệ
          if (!orderDetails || orderDetails.length === 0) {
            console.warn("Không có chi tiết đơn hàng hoặc chi tiết không hợp lệ.");
            return;
          }
    
          // Duyệt qua từng chi tiết đơn hàng
          orderDetails.forEach((detail) => {
            if (detail.productdetail && detail.quantity) {
              const productDetail = angular.copy(detail.productdetail);
    
              // Kiểm tra và xử lý giá trị tồn kho
              const quantityInStock = parseInt(productDetail.quantityinstock, 10) || 0;
              const quantityToRestore = parseInt(detail.quantity, 10) || 0;
    
              // Log để kiểm tra giá trị tồn kho
              console.log(`Sản phẩm ${productDetail.idproductdetail}: Tồn kho hiện tại: ${quantityInStock}, Số lượng khôi phục: ${quantityToRestore}`);
    
              if (quantityToRestore > 0) {
                // Cập nhật tồn kho mới
                productDetail.quantityinstock = quantityInStock + quantityToRestore;
    
                console.log(
                  `Khôi phục tồn kho: Sản phẩm ${productDetail.idproductdetail}, Tồn kho mới: ${productDetail.quantityinstock}`
                );
    
                // Cập nhật lại tồn kho trong hệ thống
                $http
                  .put(`${API}/productdetail/${productDetail.idproductdetail}`, productDetail)
                  .then((updateResponse) => {
                    // Log thông tin cập nhật thành công
                    console.log(
                      `Đã khôi phục tồn kho cho sản phẩm ${productDetail.idproductdetail}. Tồn kho mới: ${productDetail.quantityinstock}`
                    );
                    // Xác nhận rằng tồn kho đã được khôi phục
                    $scope.showMessageModal("Khôi phục tồn kho thành công!", "success");
                  })
                  .catch((error) => {
                    console.error(
                      `Có lỗi khi khôi phục tồn kho cho sản phẩm ${productDetail.idproductdetail}: `,
                      error
                    );
                    // Hiển thị thông báo lỗi nếu không thể khôi phục tồn kho
                    $scope.showMessageModal(
                      "Không thể khôi phục tồn kho cho sản phẩm. Vui lòng thử lại!",
                      "error"
                    );
                  });
              } else {
                console.warn(`Số lượng cần khôi phục cho sản phẩm ${productDetail.idproductdetail} không hợp lệ.`);
              }
            } else {
              console.warn("Chi tiết đơn hàng thiếu dữ liệu hoặc không hợp lệ:", detail);
            }
          });
        })
        .catch((error) => {
          console.error("Có lỗi xảy ra khi lấy chi tiết đơn hàng:", error);
          $scope.showMessageModal(
            "Không thể lấy thông tin chi tiết đơn hàng. Vui lòng thử lại!",
            "error"
          );
        });
    };
     
  },
]);

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
