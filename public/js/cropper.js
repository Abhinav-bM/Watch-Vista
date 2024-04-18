
//BRAND CROPPER

$(document).ready(function () {
  const myForm = document.forms.myForm;
  const logoInput = document.getElementById("logoInput");
  const croppedImage = document.getElementById("croppedImage");

  let cropper;

  // logoInput.addEventListener("change", function (e) {
  //   const file = e.target.files[0];

  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onload = function (e) {

  //       croppedImage.src = e.target.result;
  //       cropper = new Cropper(croppedImage, {
  //         aspectRatio: 1, 
  //         viewMode: 2,
  //       });
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // });

  myForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const croppedCanvas = cropper.getCroppedCanvas();

    if (!croppedCanvas) {

      alert("Please crop the image before submitting.");
      return;
    }


    const croppedDataUrl = croppedCanvas.toDataURL("image/jpeg");

    const croppedImageInput = document.createElement("input");
    croppedImageInput.type = "hidden";
    croppedImageInput.name = "croppedImage";
    croppedImageInput.value = croppedDataUrl;
    myForm.appendChild(croppedImageInput);

    myForm.submit();
  });
});

//BANNER CROPPER

$(document).ready(function () {
  const bannerForm = document.forms.bannerForm;
  const bannerImage = document.getElementById("bannerImage");
  const croppedImage = document.getElementById("croppedImage");

  let cropper;

  bannerImage.addEventListener("change", function (e) {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {

        croppedImage.src = e.target.result;
        cropper = new Cropper(croppedImage, {
          aspectRatio: 2, 
          viewMode: 1,
        });
      };
      reader.readAsDataURL(file);
    }
  });

  bannerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const croppedCanvas = cropper.getCroppedCanvas();

    if (!croppedCanvas) {

      alert("Please crop the image before submitting.");
      return;
    }

    const croppedDataUrl = croppedCanvas.toDataURL("image/jpeg");

    const croppedImageInput = document.createElement("input");
    croppedImageInput.type = "hidden";
    croppedImageInput.name = "croppedImage";
    croppedImageInput.value = croppedDataUrl;
    bannerForm.appendChild(croppedImageInput);

    bannerForm.submit();
  });
});


//PRODUCT MAIN CROPPER

$(document).ready(function () {
  const ProductForm = document.forms.ProductForm;
  const mainImage = document.getElementById("mainImage");
  const croppedMainImage = document.getElementById("croppedMainImage");

  let cropperMain;

  mainImage.addEventListener("change", function (e) {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {

        croppedMainImage.src = e.target.result;
        cropperMain = new Cropper(croppedMainImage, {
          aspectRatio: 1, 
          viewMode: 2,
        });
      };
      reader.readAsDataURL(file);
    }
  });

  ProductForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const croppedCanvas = cropperMain.getCroppedCanvas();

    if (!croppedCanvas) {

      alert("Please crop the image before submitting.");
      return;
    }

    const croppedDataUrl = croppedCanvas.toDataURL("image/jpeg");

    const croppedImageInput = document.createElement("input");
    croppedImageInput.type = "hidden";
    croppedImageInput.name = "croppedImage";
    croppedImageInput.value = croppedDataUrl;
    ProductForm.appendChild(croppedImageInput);

    ProductForm.submit();
  });
});



//PRODUCT SECOND CROPPER

$(document).ready(function () {
  const ProductForm = document.forms.ProductForm;
  const secondImage = document.getElementById("secondImage");
  const croppedSecondImage = document.getElementById("croppedSecondImage");

  let cropperSecond;

  secondImage.addEventListener("change", function (e) {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {

        croppedSecondImage.src = e.target.result;
        cropperSecond = new Cropper(croppedSecondImage, {
          aspectRatio: 1, 
          viewMode: 2,
        });
      };
      reader.readAsDataURL(file);
    }
  });

  ProductForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const croppedCanvas = cropperSecond.getCroppedCanvas();

    if (!croppedCanvas) {

      alert("Please crop the image before submitting.");
      return;
    }

    const croppedDataUrl = croppedCanvas.toDataURL("image/jpeg");

    const croppedImageInput = document.createElement("input");
    croppedImageInput.type = "hidden";
    croppedImageInput.name = "croppedSecondImage";
    croppedImageInput.value = croppedDataUrl;
    ProductForm.appendChild(croppedImageInput);

    ProductForm.submit();
  });
});



//PRODUCT THIRD CROPPER

$(document).ready(function () {
  const ProductForm = document.forms.ProductForm;
  const thirdImage = document.getElementById("thirdImage");
  const croppedThirdImage = document.getElementById("croppedThirdImage");

  let cropperThird;

  thirdImage.addEventListener("change", function (e) {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {

        croppedThirdImage.src = e.target.result;
        cropperThird = new Cropper(croppedThirdImage, {
          aspectRatio: 1, 
          viewMode: 2,
        });
      };
      reader.readAsDataURL(file);
    }
  });

  ProductForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const croppedCanvas = cropperThird.getCroppedCanvas();

    if (!croppedCanvas) {

      alert("Please crop the image before submitting.");
      return;
    }

    const croppedDataUrl = croppedCanvas.toDataURL("image/jpeg");

    const croppedImageInput = document.createElement("input");
    croppedImageInput.type = "hidden";
    croppedImageInput.name = "croppedThirdImage";
    croppedImageInput.value = croppedDataUrl;
    ProductForm.appendChild(croppedImageInput);

    ProductForm.submit();
  });
});



//PRODUCT FOURTH CROPPER

$(document).ready(function () {
  const ProductForm = document.forms.ProductForm;
  const fourthImage = document.getElementById("fourthImage");
  const croppedFourthImage = document.getElementById("croppedFourthImage");

  let cropperFourth;

  fourthImage.addEventListener("change", function (e) {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {

        croppedFourthImage.src = e.target.result;
        cropperFourth = new Cropper(croppedFourthImage, {
          aspectRatio: 1, 
          viewMode: 2,
        });
      };
      reader.readAsDataURL(file);
    }
  });

  ProductForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const croppedCanvas = cropperFourth.getCroppedCanvas();

    if (!croppedCanvas) {

      alert("Please crop the image before submitting.");
      return;
    }

    const croppedDataUrl = croppedCanvas.toDataURL("image/jpeg");

    const croppedImageInput = document.createElement("input");
    croppedImageInput.type = "hidden";
    croppedImageInput.name = "croppedFourthImage";
    croppedImageInput.value = croppedDataUrl;
    ProductForm.appendChild(croppedImageInput);

    ProductForm.submit();
  });
});



//BRAND UPDATE CROPPER

// $(document).ready(function () {

//   const updateBrandForm = document.forms.updateBrandForm;
//   const brandLogoInput = document.getElementById("brandLogoInput");
//   const croppedBrandLogo = document.getElementById("croppedBrandLogo");

//   let cropperLogo;

//   brandLogoInput.addEventListener("change", function (e) {
//     const file = e.target.files[0];

//     if (file) {
//       const reader = new FileReader();
//       reader.onload = function (e) {

//         croppedBrandLogo.src = e.target.result;
//         cropperLogo = new Cropper(croppedBrandLogo, {
//           aspectRatio: 1, 
//           viewMode: 2,
//         });
//       };
//       reader.readAsDataURL(file);
//     }
//   });

//   updateBrandForm.addEventListener("submit", function (e) {
//     e.preventDefault();

//     const croppedCanvas = cropperLogo.getCroppedCanvas();

//     if (!croppedCanvas) {

//       alert("Please crop the image before submitting.");
//       return;
//     }

//     const croppedDataUrl = croppedCanvas.toDataURL("image/jpeg");

//     const croppedImageInput = document.createElement("input");
//     croppedImageInput.type = "hidden";
//     croppedImageInput.name = "croppedBrandLogo";
//     croppedImageInput.value = croppedDataUrl;
//     updateBrandForm.appendChild(croppedImageInput);

//     updateBrandForm.submit();
//   });
// });