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
app.controller('AddressController', function ($scope, $http) {
  // Khởi tạo biến cần thiết
  $scope.userAddresses = [];
  $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  $scope.newAddress = {
    housenumber: '',
    roadname: '',
    district: '',
    city: 'Cần Thơ',
    ward: ''
  };
  $scope.addSuccess = "";
  $scope.addError = "";
  $scope.isEditing = false;

  // Danh sách các quận và huyện với phường và xã
  $scope.districts = [
    { name: 'Quận Ninh Kiều', wards: ['An Cư', 'An Hòa', 'An Hội', 'An Lạc', 'An Nghiệp', 'An Phú', 'An Thới', 'Bình Thủy', 'Cái Khế', 'Hưng Lợi', 'Hưng Phú', 'Tân An', 'Thới Bình', 'Trà Nóc', 'Xuân Khánh'] },
    { name: 'Quận Cái Răng', wards: ['An Cư', 'Bình Thủy', 'Cái Khế', 'Hưng Phú', 'Trà Nóc', 'Xuân Khánh'] },
    { name: 'Quận Bình Thủy', wards: ['Bình Thủy', 'Cái Khế', 'Hưng Phú', 'Hưng Lợi'] },
    { name: 'Quận Ô Môn', wards: ['An Lạc', 'Bình Thủy', 'Hưng Thạnh', 'Long Tuyền'] },
    { name: 'Huyện Phong Điền', wards: ['An Bình', 'Giai Xuân', 'Hưng Thạnh', 'Long Hòa'] },
    { name: 'Huyện Thốt Nốt', wards: ['An Lạc', 'Bình Thủy', 'Hưng Lợi'] },
    { name: 'Huyện Cờ Đỏ', wards: ['Cái Khế', 'Hưng Thạnh'] },
    { name: 'Huyện Vĩnh Thạnh', wards: ['Tân An', 'Thới Bình', 'Thới An Đông'] },
    { name: 'Huyện Thới Lai', wards: ['Thới Lai', 'Thới An Đông'] }
  ];

  // Cập nhật danh sách phường khi quận hoặc huyện thay đổi
  $scope.updateWards = function () {
    const selectedDistrict = $scope.districts.find(district => district.name === $scope.newAddress.district);
    $scope.wards = selectedDistrict ? selectedDistrict.wards : [];
    $scope.newAddress.ward = ''; // Reset phường khi quận/huyện thay đổi
  };

  // Phương thức lấy địa chỉ của người dùng đã đăng nhập
  $scope.loadUserAddresses = function () {
    if ($scope.loggedInUser) {
      $http.get(`http://localhost:8080/beesixcake/api/address/account/${$scope.loggedInUser.idaccount}`)
        .then(function (response) {
          $scope.userAddresses = Array.isArray(response.data) ? response.data : [];
        })
        .catch(function (error) {
          console.error("Lỗi khi tải danh sách địa chỉ:", error);
        });
    } else {
      $scope.userAddresses = [];
    }
  };

  // Phương thức mở modal và hiển thị thông tin địa chỉ cần sửa
  $scope.editAddress = function (address) {
    $scope.newAddress = angular.copy(address); // Sao chép địa chỉ cần chỉnh sửa
    
    // Cập nhật danh sách phường trước khi hiển thị modal
    const selectedDistrict = $scope.districts.find(district => district.name === $scope.newAddress.district);
    $scope.wards = selectedDistrict ? selectedDistrict.wards : [];
    
    $scope.isEditing = true;
    
    // Hiển thị modal chỉnh sửa
    var addressModal = new bootstrap.Modal(document.getElementById('addressModal'), {});
    addressModal.show();
  };

  // Phương thức lưu địa chỉ
  $scope.saveAddress = function () {
    if (!$scope.newAddress.housenumber || !$scope.newAddress.roadname || !$scope.newAddress.district || !$scope.newAddress.ward) {
      $scope.addError = "Vui lòng điền đầy đủ thông tin địa chỉ!";
      $scope.addSuccess = "";
      return;
    }

    const addressData = {
      idaddress: $scope.isEditing ? $scope.newAddress.idaddress : 0,
      housenumber: $scope.newAddress.housenumber,
      roadname: $scope.newAddress.roadname,
      ward: $scope.newAddress.ward,
      district: $scope.newAddress.district,
      city: $scope.newAddress.city,
      account: { idaccount: $scope.loggedInUser.idaccount }
    };

    const request = $scope.isEditing
      ? $http.put(`http://localhost:8080/beesixcake/api/address/${$scope.newAddress.idaddress}`, addressData)
      : $http.post('http://localhost:8080/beesixcake/api/address', addressData);

    request
      .then(function (response) {
        $scope.addSuccess = $scope.isEditing ? "Cập nhật địa chỉ thành công!" : "Thêm địa chỉ thành công!";
        $scope.addError = "";
        $scope.isEditing = false;
        $scope.resetForm();
        $scope.loadUserAddresses();
      })
      .catch(function (error) {
        $scope.addError = error.data?.message || "Đã xảy ra lỗi không xác định.";
        $scope.addSuccess = "";
      });
  };

  // Đặt lại form về trạng thái ban đầu
  $scope.resetForm = function () {
    $scope.newAddress = { housenumber: '', roadname: '', district: '', city: 'Cần Thơ', ward: '' };
    $scope.wards = []; // Đặt lại danh sách phường
    $scope.isEditing = false;
    $scope.addSuccess = "";
    $scope.addError = "";
  };

  // Đặt địa chỉ mặc định
  $scope.setAsDefault = function (address) {
    if (address.isDefault) return;

    $scope.userAddresses.forEach(addr => addr.isDefault = false);
    address.isDefault = true;

    const addressData = {
      ...address,
      account: { idaccount: $scope.loggedInUser.idaccount },
      isDefault: true
    };

    $http.put(`http://localhost:8080/beesixcake/api/address/${address.idaddress}`, addressData)
      .then(function () {
        $scope.loadUserAddresses();
        $scope.addSuccess = "Địa chỉ mặc định đã được thay đổi!";
      })
      .catch(function (error) {
        $scope.addError = error.data?.message || "Đã xảy ra lỗi không xác định.";
      });
  };

  // Xác nhận và xóa địa chỉ
  $scope.openDeleteModal = function (address) {
    $scope.addressToDelete = address;
    var modal = new bootstrap.Modal(document.getElementById("deleteConfirmationModal"));
    modal.show();
  };

  $scope.closeDeleteModal = function () {
    $scope.addressToDelete = null;
    var modal = bootstrap.Modal.getInstance(document.getElementById("deleteConfirmationModal"));
    modal.hide();
  };

  $scope.confirmDelete = function () {
    if ($scope.addressToDelete) {
      $http.delete(`http://localhost:8080/beesixcake/api/address/${$scope.addressToDelete.idaddress}`)
        .then(function () {
          $scope.loadUserAddresses();
          $scope.closeDeleteModal();
          $scope.resetForm(); // Reset form sau khi xóa
        })
        .catch(function (error) {
          console.error("Lỗi khi xóa địa chỉ:", error);
        });
    }
  };

  $scope.setDefaultAddress = function(address) {
    // Gửi yêu cầu PUT để thay đổi địa chỉ mặc định
    $http.put(`http://localhost:8080/beesixcake/api/address/default?idaddress=${address.idaddress}`)
        .then(function(response) {
            // Tải lại danh sách địa chỉ để cập nhật trạng thái mặc định
            $scope.getUserAddresses();
            alert('Địa chỉ đã được đặt làm mặc định');
        }, function(error) {
            alert('Có lỗi xảy ra khi đặt địa chỉ mặc định');
        });
};

  // Tải danh sách địa chỉ khi controller khởi tạo
  $scope.loadUserAddresses();
});

