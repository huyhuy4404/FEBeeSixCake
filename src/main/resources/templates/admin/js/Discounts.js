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

app.controller('discountsController', function ($scope, $http) {
    // Khởi tạo các biến
    $scope.Discounts = [];
    $scope.filteredDiscounts = [];
    $scope.paginatedDiscounts = [];
    $scope.currentPage = 1;
    $scope.itemsPerPage = 8;
    $scope.totalPages = 0;
    $scope.searchQuery = ""; // Thêm biến tìm kiếm
    $scope.selecteddiscount = {}; // Đối tượng khuyến mãi được chọn
    $scope.filterOption = ""; // Tùy chọn lọc

    // Lấy danh sách khuyến mãi từ API
    $scope.getDiscounts = function () {
        $http.get('http://localhost:8080/beesixcake/api/discount')
            .then(function (response) {
                $scope.Discounts = response.data; // Lưu danh sách khuyến mãi
                $scope.updatePagination(); // Cập nhật phân trang sau khi tải khuyến mãi
            }, function (error) {
                console.log('Error fetching discounts:', error);
            });
    };
     // Hàm lọc mã giảm giá
     $scope.filterCondition = function(discount) {
        const now = new Date();
        if ($scope.filterOption === "valid") {
            return new Date(discount.enddate) > now; // Còn hạn
        } else if ($scope.filterOption === "expired") {
            return new Date(discount.enddate) <= now; // Hết hạn
        }
        return true; // Tất cả
    };

    // Cập nhật khi người dùng thay đổi tùy chọn lọc
    $scope.updateFilter = function() {
        $scope.currentPage = 1; // Đặt về trang đầu
        $scope.updatePagination(); // Cập nhật danh sách hiển thị
    };
    // Hàm phân trang
    $scope.updatePagination = function () {
        // Lọc danh sách khuyến mãi dựa trên tìm kiếm
        $scope.filteredDiscounts = $scope.Discounts.filter(discount => {
            return $scope.searchFilter(discount); // Sử dụng hàm tìm kiếm để lọc
        });

        // Tính tổng số trang
        $scope.totalPages = Math.ceil($scope.filteredDiscounts.length / $scope.itemsPerPage);

        // Điều chỉnh trang hiện tại nếu vượt quá tổng số trang
        if ($scope.currentPage > $scope.totalPages) {
            $scope.currentPage = $scope.totalPages;
        }

        // Xác định phạm vi các khuyến mãi hiển thị trên trang hiện tại
        const start = ($scope.currentPage - 1) * $scope.itemsPerPage;
        const end = start + $scope.itemsPerPage;
        $scope.paginatedDiscounts = $scope.filteredDiscounts.slice(start, end);
        // Hàm chuyển đến trang tiếp theo
    $scope.nextPage = function () {
      if ($scope.currentPage < $scope.totalPages) {
          $scope.currentPage++;
          $scope.updatePagination();
      }
  };

  // Hàm chuyển về trang trước
  $scope.prevPage = function () {
      if ($scope.currentPage > 1) {
          $scope.currentPage--;
          $scope.updatePagination();
      }
  };
    };
    

    // Chuyển trang
    $scope.goToPage = function (page) {
        if (page >= 1 && page <= $scope.totalPages) {
            $scope.currentPage = page;
            $scope.updatePagination();
        }
    };

    // Cập nhật tìm kiếm
    $scope.updateSearch = function () {
        $scope.currentPage = 1; // Đặt về trang đầu
        $scope.updatePagination(); // Cập nhật danh sách
    };

    // Hàm tìm kiếm
    $scope.searchFilter = function (discount) {
        if (!$scope.searchQuery) {
            return true; // Nếu không có giá trị tìm kiếm, trả tất cả
        }
        var query = $scope.searchQuery.toLowerCase(); // Chuyển đổi tìm kiếm thành chữ thường
        return discount.discountcode.toLowerCase().includes(query); // Lọc theo mã giảm giá
    };

    // Hàm kiểm tra và cập nhật phần trăm giảm giá
    $scope.updateDiscountPercentage = function () {
        var lowestPrice = parseFloat($scope.selecteddiscount.lowestprice); // Chuyển đổi thành số
        if (lowestPrice >= 120000) {
            $scope.selecteddiscount.discountpercentage = 10; // Đặt phần trăm giảm giá là 10%
        } else if (lowestPrice < 30000 && $scope.selecteddiscount.discountpercentage !== null) {
            // Nếu giá trị dưới 30,000 và phần trăm giảm giá đã được xác định trước đó
            // Giữ nguyên giá trị hiện tại của phần trăm giảm giá
            $scope.selecteddiscount.discountpercentage = $scope.selecteddiscount.discountpercentage;
        }
    };

    // Cập nhật khi người dùng thay đổi mức giá tối thiểu
    $scope.$watch('selecteddiscount.lowestprice', function (newValue) {
        $scope.updateDiscountPercentage();
    });

    // Hiển thị modal thông báo
    $scope.showMessageModal = function (message, isError = false) {
        $scope.messageModalBody = message; // Cập nhật nội dung thông báo
        const modalTitle = isError ? "Thông báo lỗi" : "Thông báo thành công";
        $('#messageModal .modal-title').text(modalTitle); // Cập nhật tiêu đề
        $('#messageModalBody').text(message); // Cập nhật nội dung modal
        $('#messageModal').modal('show'); // Hiển thị modal
    };

    // Thêm khuyến mãi
    $scope.adddiscount = function () {
        // Xóa thông báo trước đó
        $scope.message = '';
        
        // Kiểm tra từng trường nhập liệu
        if (!$scope.selecteddiscount.discountcode) {
            $scope.showMessageModal("Vui lòng nhập mã giảm giá.", true);
            console.error("Thiếu discountcode");
            return;
        }
        if (!$scope.selecteddiscount.discountpercentage) {
            $scope.showMessageModal("Vui lòng nhập phần trăm giảm giá.", true);
            console.error("Thiếu discountpercentage");
            return;
        } else if ($scope.selecteddiscount.discountpercentage > 50) {
            $scope.showMessageModal("Phần trăm giảm giá không được vượt quá 50%.", true);
            console.error("discountpercentage vượt quá 50%");
            return;
        }
        if (!$scope.selecteddiscount.lowestprice) {
            $scope.showMessageModal("Vui lòng nhập đơn hàng tối thiểu.", true);
            console.error("Thiếu lowestprice");
            return;
        } else if ($scope.selecteddiscount.lowestprice < 1000) {
            $scope.showMessageModal("Đơn hàng tối thiểu không được dưới 1.000.", true);
            console.error("lowestprice dưới 1.000");
            return;
        }
        if (!$scope.selecteddiscount.startdate || !$scope.selecteddiscount.enddate) {
            $scope.showMessageModal("Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.", true);
            console.error("Thiếu startdate hoặc enddate");
            return;
        } else if ($scope.selecteddiscount.startdate > $scope.selecteddiscount.enddate) {
            $scope.showMessageModal("Ngày bắt đầu không thể lớn hơn ngày kết thúc. Vui lòng kiểm tra lại.", true);
            console.error("startdate lớn hơn enddate");
            return;
        }

        // Nếu không có lỗi, chuẩn bị dữ liệu để gửi
        var newdiscount = {
            discountcode: $scope.selecteddiscount.discountcode,
            discountpercentage: $scope.selecteddiscount.discountpercentage,
            startdate: $scope.selecteddiscount.startdate.toISOString(),
            enddate: $scope.selecteddiscount.enddate.toISOString(),
            lowestprice: parseFloat($scope.selecteddiscount.lowestprice) || 0
        };

        // Gửi yêu cầu POST để tạo giảm giá mới
        $http.post('http://localhost:8080/beesixcake/api/discount', newdiscount)
            .then(function (response) {
                $scope.showMessageModal('Thêm khuyến mãi thành công!'); // Hiển thị thông báo thành công
                $scope.getDiscounts(); // Tải lại danh sách sau khi thêm
                $scope.resetForm(); // Làm mới form
            }, function (error) {
                console.error('Error adding discount:', error);
                // Kiểm tra lỗi từ phản hồi của máy chủ
                if (error.data && error.data.message) {
                    $scope.showMessageModal(error.data.message, true); // Hiển thị thông báo từ máy chủ nếu có
                } else {
                    $scope.showMessageModal('Mã khuyến mãi đã tồn tại.', true);
                }
            });
    };

    // Chỉnh sửa khuyến mãi
    $scope.editdiscount = function () {
    // Kiểm tra nếu ngày bắt đầu lớn hơn ngày kết thúc
    if ($scope.selecteddiscount.startdate > $scope.selecteddiscount.enddate) {
        $scope.showMessageModal('Ngày bắt đầu không thể lớn hơn ngày kết thúc. Vui lòng kiểm tra lại.', true);
        return; // Dừng thực hiện hàm nếu điều kiện không thỏa mãn
    }

    // Kiểm tra đơn hàng tối thiểu
    if ($scope.selecteddiscount.lowestprice < 1000) {
        $scope.showMessageModal('Đơn hàng tối thiểu là 1.000.', true);
        return; // Dừng thực hiện hàm nếu điều kiện không thỏa mãn
    }

    // Kiểm tra phần trăm giảm giá không vượt quá 50%
    if ($scope.selecteddiscount.discountpercentage > 50) {
        $scope.showMessageModal('Phần trăm giảm giá không được vượt quá 50%.', true);
        return; // Dừng thực hiện hàm nếu điều kiện không thỏa mãn
    }

    var editeddiscount = {
        iddiscount: $scope.selecteddiscount.iddiscount,
        discountcode: $scope.selecteddiscount.discountcode,
        discountpercentage: $scope.selecteddiscount.discountpercentage,
        startdate: $scope.selecteddiscount.startdate.toISOString(),
        enddate: $scope.selecteddiscount.enddate.toISOString(),
        lowestprice: parseFloat($scope.selecteddiscount.lowestprice) || 0
    };

    $http.put('http://localhost:8080/beesixcake/api/discount/' + editeddiscount.iddiscount, editeddiscount)
        .then(function (response) {
            $scope.showMessageModal('Sửa khuyến mãi thành công!'); // Hiển thị thông báo thành công
            $scope.getDiscounts(); // Tải lại danh sách sau khi sửa
            $scope.resetForm(); // Làm mới form
        }, function (error) {
            console.error('Error editing discount:', error);
            if (error.data && error.data.message) {
                $scope.showMessageModal(error.data.message, true); // Hiển thị thông báo từ máy chủ nếu có
            } else {
                $scope.showMessageModal('Có lỗi xảy ra khi sửa khuyến mãi. Vui lòng thử lại.', true);
            }
        });
};

    // Xóa khuyến mãi
    $scope.deletediscount = function (discount) {
        if (confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
            $http.delete('http://localhost:8080/beesixcake/api/discount/' + discount.iddiscount)
                .then(function (response) {
                    alert('Xóa khuyến mãi thành công!');
                    $scope.getDiscounts(); // Tải lại danh sách sau khi xóa
                }, function (error) {
                    console.error('Error editing discount:', error);
                    // Kiểm tra lỗi từ phản hồi của máy chủ
                   
                        $scope.showMessageModal('Có lỗi xảy ra khi sửa khuyến mãi. Vui lòng thử lại.', true);
                });
        }
        $scope.resetForm();
    };

    // Hàm định dạng tiền tệ
    $scope.formatCurrency = function (amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Chuyển dữ liệu khuyến mãi vào form để chỉnh sửa
    $scope.goToEdit = function (discount) {
        $scope.selecteddiscount = angular.copy(discount);

        // Chuyển đổi các trường ngày sang đối tượng Date
        if (discount.startdate) {
            $scope.selecteddiscount.startdate = new Date(discount.startdate);
        }
        if (discount.enddate) {
            $scope.selecteddiscount.enddate = new Date(discount.enddate);
        }

        // Chuyển sang tab "Chỉnh sửa danh sách mã giảm giá" (tab thứ hai)
        var passwordTab = document.getElementById('password-tab');
        var passwordTabPane = document.getElementById('password-tab-pane');

        // Thay đổi lớp cho tab chỉnh sửa
        passwordTab.classList.add('active');
        passwordTabPane.classList.add('show', 'active');

        // Đổi lớp cho tab đầu tiên
        var profileTab = document.getElementById('profile-tab');
        var profileTabPane = document.getElementById('profile-tab-pane');
        profileTab.classList.remove('active');
        profileTabPane.classList.remove('show', 'active');
    };

    // Làm mới form
    $scope.resetForm = function () {
        $scope.selecteddiscount = {};
    };
    

    // Gọi hàm để lấy dữ liệu
    $scope.getDiscounts();
});