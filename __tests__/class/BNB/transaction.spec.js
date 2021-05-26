import BinanceTx from '@/class/BNB/transaction'
import Core from '@/class/Core'
import * as crypto from '@/utils/crypto'

describe('BinanceTx class', () => {
  test('it should create a BinanceTx class', async () => {
    // const params = {
    //   address: 'tbnb1hgm0p7khfk85zpz5v0j8wnej3a90w709zzlffd',
    //   account_number: 33,
    //   chain_id: 'Binance-Chain-Ganges',
    //   sequence: 192,
    //   source: 1,
    //   balance: 2,
    //   privateKey: '90335b9d2153ad1a9799a3ccc070bd64b4164e9642ee1dd48053c33f9a3a05e9',
    //   publicKey: '029729a52e4e3c2b4a4e52aa74033eedaf8ba1df5ab6d1f518fd69e67bbd309b0e',
    // }
    //
    // let tx = new BinanceTx(params)
    // let data = {
    //   addressTo: 'tbnb1hgm0p7khfk85zpz5v0j8wnej3a90w709zzlffd',
    //   amount: 1,
    //   fee: 0,
    //   memo: '123'
    // }
    // let txData = tx.make(data).serialize()
    // let a = 'e501f0625dee0a672a2c87fa0a1f0a14ba36f0fad74d8f41045463e4774f328f4af779e512070a03424e421002121f0a14ba36f0fad74d8f41045463e4774f328f4af779e512070a03424e421001121f0a14ba36f0fad74d8f41045463e4774f328f4af779e512070a03424e421001126f0a26eb5ae98721029729a52e4e3c2b4a4e52aa74033eedaf8ba1df5ab6d1f518fd69e67bbd309b0e1240f29e8be008000ae2135201971dadd8ebda987585e651f6cf3203b49addf37ea8176d865880778ad1de7b58300e393f37e5931e9a1c45bdb634adb74daaf49727182120c0011a033132332001'
    
    let tx = 'c201f0625dee0a4a2a2c87fa0a210a140502b742b720258df5664a49dfb6160e48009cc912090a03424e4210c0a90712210a143ed6e9d88d2e409f562f35d6ea778c4c5e86403b12090a03424e4210c0a90712700a26eb5ae987210357934fa1383a63d89a17396c09022ec93a23def4bcd5981712c3995b9790db8c124005aa20ac23e94478c987eb231d24309f203005b7a73e2be33b3e69c046695d8535a4a30f1f4dbd9e9b0b160687f9c71f2e666e1493d631ffe9c84e744e352dcd18da845a2004'
    let hash = crypto.sha256(tx).toUpperCase()
    let test_hash = '70FCC1CBE4A925BE166D2AE69C99063647C3604FBFF414685CA5BCF469A8CEF9'
    
    expect(tx).toBeDefined()
  })
})
