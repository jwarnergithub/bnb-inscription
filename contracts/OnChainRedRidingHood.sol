// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract OnChainRedRidingHood is ERC721, Ownable {
    using Strings for uint256;

    struct TokenData {
        string name;
        string description;
        string[] imageChunks;
        bool frozen;
    }

    mapping(uint256 => TokenData) private _tokenData;

    event ImageChunksAppended(uint256 indexed tokenId, uint256 firstChunkIndex, uint256 chunkCount);
    event TokenFrozen(uint256 indexed tokenId);

    constructor(address initialOwner)
        ERC721("On-Chain Red Riding Hood", "REDHOOD")
    {
        if (initialOwner != _msgSender()) {
            transferOwnership(initialOwner);
        }
    }

    function mint(
        address to,
        uint256 tokenId,
        string calldata name_,
        string calldata description_
    ) external onlyOwner {
        _safeMint(to, tokenId);

        TokenData storage data = _tokenData[tokenId];
        data.name = name_;
        data.description = description_;
    }

    function appendImageChunks(
        uint256 tokenId,
        string[] calldata chunks
    ) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        require(!_tokenData[tokenId].frozen, "Token is frozen");
        require(chunks.length > 0, "No chunks supplied");

        TokenData storage data = _tokenData[tokenId];
        uint256 firstChunkIndex = data.imageChunks.length;

        for (uint256 i = 0; i < chunks.length; i++) {
            data.imageChunks.push(chunks[i]);
        }

        emit ImageChunksAppended(tokenId, firstChunkIndex, chunks.length);
    }

    function freeze(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");

        TokenData storage data = _tokenData[tokenId];
        require(!data.frozen, "Token is frozen");
        require(data.imageChunks.length > 0, "No image uploaded");

        data.frozen = true;

        emit TokenFrozen(tokenId);
    }

    function chunkCount(uint256 tokenId) external view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenData[tokenId].imageChunks.length;
    }

    function frozen(uint256 tokenId) external view returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenData[tokenId].frozen;
    }

    function imageBase64(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        string[] storage chunks = _tokenData[tokenId].imageChunks;
        uint256 totalLength = 0;

        for (uint256 i = 0; i < chunks.length; i++) {
            totalLength += bytes(chunks[i]).length;
        }

        bytes memory output = new bytes(totalLength);
        uint256 offset = 0;

        for (uint256 i = 0; i < chunks.length; i++) {
            bytes memory part = bytes(chunks[i]);

            for (uint256 j = 0; j < part.length; j++) {
                output[offset] = part[j];
                offset++;
            }
        }

        return string(output);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        TokenData storage data = _tokenData[tokenId];

        bytes memory json = abi.encodePacked(
            '{"name":"',
            data.name,
            '","description":"',
            data.description,
            '","image":"data:image/jpeg;base64,',
            imageBase64(tokenId),
            '","attributes":[{"trait_type":"Storage","value":"Fully on-chain"},{"trait_type":"Chain","value":"BNB Smart Chain"}]}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(json));
    }
}
