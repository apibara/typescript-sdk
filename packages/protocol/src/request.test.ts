import { DataFinality } from './proto'
import { TestFilter } from './proto/testing'
import { stream_data_request } from './request'

describe('RequestBuilder', () => {
  it('returns the final request', () => {
    const filter = new TestFilter({
      num: 123,
      text: 'abcdef',
    })

    const request = stream_data_request()
      .with_batch_size(10)
      .with_filter(filter)
      .with_finality(DataFinality.DATA_STATUS_FINALIZED)
      .build()

    expect(request.batchSize).toBe(10)
    expect(request.filter).toBeInstanceOf(Buffer)
    expect(request.filter?.length).toBe(10)

    // make ts happy
    if (!request.filter || typeof request.filter == 'string') {
      throw new Error('undefined filter')
    }

    const back = TestFilter.decode(request.filter)
    expect(back.num).toBe(123)
    expect(back.text).toBe('abcdef')
  })
})
