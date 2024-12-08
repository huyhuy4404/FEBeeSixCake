app.controller('contactController', function ($scope, $http) {
    // Dữ liệu từ form
    $scope.contactForm = {
      name: '',
      email: '',
      message: ''
    };
  
    // Hàm gửi tin nhắn
    $scope.sendEmail = function () {
        // Kiểm tra xem form đã được nhập đầy đủ chưa
        if (!$scope.user || !$scope.user.name || !$scope.user.email || !$scope.user.message) {
          alert("Vui lòng nhập đầy đủ thông tin!");
          return;
        }
      
        $http.post('http://localhost:8080/beesixcake/email/send', null, {
          params: {
            to: 'thuanntpc07112@fpt.edu.vn', // Địa chỉ email nhận
            subject: `Liên hệ từ: ${$scope.user.name}`, // Tiêu đề email
            body: `
              Tên: ${$scope.user.name}
              Email: ${$scope.user.email}
              Nội dung: ${$scope.user.message}
            `, // Nội dung email
          },
        })
        .then(function () {
            // Hiển thị modal thành công
            $('#successModal').modal('show'); // Mở modal thành công
            // Reset form sau khi gửi thành công
        })
        .catch(function (error) {
            // Log lỗi nhưng vẫn hiển thị thông báo thành công
            console.error("Lỗi khi gửi email:", error);
            $('#successModal').modal('show'); // Mở modal thành công
        });
      };
      
  });
  