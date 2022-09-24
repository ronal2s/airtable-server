const generateHTML = (Product) => {
    let materials = "";
    Product["Materials and Finishes"].forEach((item) => {
        materials += `${item}, `;
    })
    return `
    <html>
    <style>
        h4, h5, h2, h6, p {
            margin: 0;
            color: white;
        }
    </style>
    <body style="font-weight: 100;" >
        <div id="header" style="width: 500px; background-color: #353b48;" >
            <h1 style="text-align: center; color: white; font-weight: 100;" >${Product.Name}</h1>
            <br/>
            <div style="background-color: #353b48; margin-top: -19px;" >
            ${Product.Picture.map((item, key) => {
        return `<img style="object-fit: cover;" src="${item.url}" width="163" height="150"  />`
    })}
            </div>
            <div style="background-color: #2f3640; padding: 10px;" >
                <h2 style="color: #27ae60;" >US $${Product['Unit Cost']}</h2>
                <h4>Type ${Product.Type}</h4>
                <h5>Size ${Product["Size (WxLxH)"]}</h5>
                <h6>Materials ${materials}</h6>
                <p>${Product.Description}</p>
            </div>
        </div>
    </body>
</html>
    `
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { generateHTML, sleep }