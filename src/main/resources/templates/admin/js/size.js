var app = angular.module('myApp', []);
app.controller("CheckLogin", function ($scope, $http, $window) {
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
  
  
  
app.controller('SizeController', function($scope, $http, $timeout) {
    $scope.Sizes = [];  // Danh sách kích thước
    $scope.selectedSize = {};  // Kích thước đang chọn
    $scope.isEditMode = false;

    // Hàm load danh sách kích thước từ API
    $scope.loadSizes = function(resetMessage = true) {
        $scope.selectedSize = {};  // Đặt lại form kích thước
        $scope.isEditMode = false; // Thoát khỏi chế độ chỉnh sửa (nếu đang chỉnh sửa)

        $http.get('http://localhost:8080/beesixcake/api/size')
            .then(function(response) {
                $scope.Sizes = response.data;  // Cập nhật danh sách kích thước
            })
            .catch(function(error) {
                showMessageModal('Có lỗi xảy ra khi làm mới danh sách.', false);
            });
    };

    $scope.addSize = function() {
      // Kiểm tra xem kích thước đã tồn tại trong danh sách chưa
      const sizeExists = $scope.Sizes.some(function(size) {
          return size.sizename.toLowerCase() === $scope.selectedSize.sizename.toLowerCase();  // So sánh không phân biệt chữ hoa, chữ thường
      });
  
      if (sizeExists) {
          showMessageModal('Kích thước đã tồn tại!', false);
          $scope.selectedSize = {};  // Reset form nếu kích thước đã tồn tại
          return;  // Dừng lại nếu kích thước đã tồn tại
      }
  
      // Kiểm tra xem trường 'sizename' có trống không
      if (!$scope.selectedSize.sizename || !$scope.selectedSize.sizename.trim()) {
          showMessageModal('Vui lòng nhập kích thước.', false);
          return;
      }
  
      // Nếu không có trùng lặp, thực hiện thêm kích thước
      $http.post('http://localhost:8080/beesixcake/api/size', $scope.selectedSize)
          .then(function(response) {
              showMessageModal('Thêm kích thước thành công!', false);
              $scope.Sizes.unshift(response.data);  // Thêm kích thước mới vào đầu danh sách
              $scope.selectedSize = {};  // Reset form sau khi thêm thành công
          })
          .catch(function(error) {
              if (error.data && error.data.message) {
                  showMessageModal('Có lỗi xảy ra khi thêm kích thước: ' + error.data.message, false);
              } else {
                  showMessageModal('Có lỗi xảy ra khi thêm kích thước.', false);
              }
          });
  };
  
    // Hàm chỉnh sửa kích thước
    $scope.editSize = function(size) {
        $scope.selectedSize = angular.copy(size);  // Sao chép dữ liệu kích thước vào form
        $scope.isEditMode = true;

        // Kích hoạt tab "Chỉnh sửa"
        var editTab = document.getElementById('edit-tab');
        var tab = new bootstrap.Tab(editTab); // Sử dụng Bootstrap Tab
        tab.show();  // Hiển thị tab "Chỉnh sửa"
    };

    // Hàm cập nhật kích thước
    $scope.updateSize = function() {
        // Kiểm tra xem trường 'sizename' có trống không
        if (!$scope.selectedSize.sizename || !$scope.selectedSize.sizename.trim()) {
            showMessageModal('Vui lòng nhập kích thước.', false);
            return;
        }

        $http.put('http://localhost:8080/beesixcake/api/size/' + $scope.selectedSize.idsize, $scope.selectedSize)
            .then(function(response) {
                showMessageModal('Cập nhật kích thước thành công!', false);
                $scope.loadSizes(false);  // Không reset thông báo
                $scope.isEditMode = false;  // Tắt chế độ chỉnh sửa
                $scope.selectedSize = {};  // Reset form
            })
            .catch(function(error) {
                if (error.data && error.data.message) {
                    showMessageModal('Có lỗi xảy ra khi cập nhật kích thước: ' + error.data.message, false);
                } else {
                    showMessageModal('Có lỗi xảy ra khi cập nhật kích thước.', false);
                }
            });
    };

    // Hàm xóa kích thước
    $scope.deleteSize = function(idsize) {
        showMessageModal(
            'Bạn có chắc chắn muốn xóa kích thước này?',
            true,
            function() {
                $http.delete('http://localhost:8080/beesixcake/api/size/' + idsize)
                    .then(function(response) {
                        showMessageModal('Xóa kích thước thành công!', false);
                        $scope.loadSizes();  // Tải lại danh sách và reset thông báo
                    })
                    .catch(function(error) {
                        if (error.status === 409) { // Kiểm tra mã trạng thái HTTP 409 Conflict
                            // Thông báo lỗi cụ thể khi kích thước đang được sử dụng
                            showMessageModal('Không thể xóa kích thước này vì nó đang được sử dụng bởi một hoặc nhiều sản phẩm.', false);
                        } else if (error.data && error.data.message) {
                            // Thông báo lỗi từ API nếu có
                            showMessageModal('Có lỗi xảy ra khi xóa kích thước: ' + error.data.message, false);
                        } else {
                            // Thông báo lỗi chung nếu không có thông tin chi tiết
                            showMessageModal('Không thể xóa kích thước này vì kích thước đang được sử dụng bởi một sản phẩm!', false);
                        }
                    });
            }
        );
    };

    // Tải danh sách kích thước khi khởi tạo
    $scope.loadSizes();
});

// Hàm dùng để hiển thị modal với thông báo và xác nhận
function showMessageModal(message, isConfirm = false, confirmCallback = null) {
  document.getElementById("messageModalBody").innerText = message;

  const confirmButton = document.getElementById("confirmModalButton");
  if (isConfirm) {
      confirmButton.style.display = "inline-block";
      // Xóa các sự kiện cũ trước khi thêm sự kiện mới
      confirmButton.replaceWith(confirmButton.cloneNode(true));
      const newConfirmButton = document.getElementById("confirmModalButton");
      newConfirmButton.style.display = "inline-block";
      newConfirmButton.addEventListener("click", function () {
          if (typeof confirmCallback === "function") {
              confirmCallback();
          }
      });
  } else {
      confirmButton.style.display = "none";
      confirmButton.onclick = null;
  }

  const myModalElement = document.getElementById("messageModal");
  const myModal = new bootstrap.Modal(myModalElement);
  myModal.show();
}
